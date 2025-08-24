import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, query } from './database';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d';
export class AuthService {
    static async hashPassword(password) {
        const saltRounds = 12;
        return bcrypt.hash(password, saltRounds);
    }
    static async verifyPassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }
    static generateToken(userId) {
        return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }
    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    static async createUser(userData) {
        const { email, password, name, avatar_url, role = 'user' } = userData;
        // Check if user already exists
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        // Hash password
        const hashedPassword = await this.hashPassword(password);
        // Determine if user should be admin based on email
        const isAdmin = email.includes('admin') || email.endsWith('@lethashop.com');
        const userRole = isAdmin ? 'admin' : role;
        // Create user
        const result = await query(`INSERT INTO users (email, password_hash, name, avatar_url, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, avatar_url, role, is_active, created_at, updated_at`, [email, hashedPassword, name, avatar_url, userRole, true]);
        return result.rows[0];
    }
    static async signIn(signInData) {
        const { email, password } = signInData;
        // Find user by email
        const result = await query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
        if (result.rows.length === 0) {
            throw new Error('Invalid email or password');
        }
        const user = result.rows[0];
        // Verify password
        const isValidPassword = await this.verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }
        // Generate token
        const token = this.generateToken(user.id);
        // Remove password hash from user object
        const { password_hash, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            token
        };
    }
    static async getUserById(userId) {
        const result = await query('SELECT id, email, name, avatar_url, role, is_active, created_at, updated_at FROM users WHERE id = $1 AND is_active = true', [userId]);
        return result.rows[0] || null;
    }
    static async updateUser(userId, updateData) {
        const allowedFields = ['name', 'avatar_url'];
        const updates = [];
        const values = [];
        let paramCount = 1;
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updates.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }
        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }
        updates.push(`updated_at = NOW()`);
        values.push(userId);
        const queryStr = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, name, avatar_url, role, is_active, created_at, updated_at
    `;
        const result = await query(queryStr, values);
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }
        return result.rows[0];
    }
    static async deactivateUser(userId) {
        await query('UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1', [userId]);
    }
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
    static async authenticateRequest(authHeader) {
        const token = this.extractTokenFromHeader(authHeader);
        if (!token) {
            throw new Error('No token provided');
        }
        const { userId } = this.verifyToken(token);
        const user = await this.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
}
