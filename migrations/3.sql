
CREATE TABLE admin_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admin_info (note) VALUES ('Admin Access Information: This app uses Google OAuth authentication. To access the admin panel, sign in with a Google account that has "admin" in the email address or uses the @lethashop.com domain. For development purposes, you can use lethashopadmin@gmail.com or similar admin email.');
