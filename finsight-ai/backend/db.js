const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'users.json');

// Initialize mock DB
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

function getUsers() {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
}

function saveUsers(users) {
  fs.writeFileSync(dbPath, JSON.stringify(users, null, 2));
}

module.exports = {
  getUsers,
  saveUsers,
  getUserByEmail: (email) => getUsers().find(u => u.email === email),
  createUser: (user) => {
    const users = getUsers();
    const newUser = { id: Date.now().toString(), ...user, created_at: new Date().toISOString() };
    users.push(newUser);
    saveUsers(users);
    return newUser;
  }
};
