// index.js
// Required modules
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

// Initialize Express application
const app = express();

// Define paths
const clientPath = path.join(__dirname, '..', 'client/src');
const dataPath = path.join(__dirname, 'data', 'users.json');
const serverPublic = path.join(__dirname, 'public');
// Middleware setup
app.use(express.static(clientPath)); // Serve static files from client directory
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies

// Routes

// Home route
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: clientPath });
});

app.get('/users', async (req, res) => {
    try {
        const data = await fs.readFile(dataPath, 'utf8');

        const users = JSON.parse(data);
        if (!users) {
            throw new Error("Error no users available");
        }
        res.status(200).json(users);
    } catch (error) {
        console.error("Problem getting users" + error.message);
        res.status(500).json({ error: "Problem reading users" });
    }
});

// Form route
app.get('/form', (req, res) => {
    res.sendFile('pages/form.html', { root: serverPublic });
});

// Form submission route
app.post('/submit-form', async (req, res) => {
    try {
        const { name, message } = req.body;

        // Read existing users from file
        let users = [];
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            users = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist or is empty, start with an empty array
            console.error('Error reading user data:', error);
            users = [];
        }

        // Find or create user
        let user = users.find(u => u.name === name);
        if (user) {
            user.messages.push(message);
        } else {
            user = { name, messages: [message] };
            users.push(user);
        }

        // Save updated users
        await fs.writeFile(dataPath, JSON.stringify(users, null, 2));
        res.redirect('/form');
    } catch (error) {
        console.error('Error processing form:', error);
        res.status(500).send('An error occurred while processing your submission.');
    }
});

// Update user route (currently just logs and sends a response)
app.put('/update-user/:currentName/:currentEmail', async (req, res) => {
    try {
        const { currentName, currentPower } = req.params;
        const { newName, newPower } = req.body;
        console.log('Current user:', { currentName, currentPower });
        console.log('New user data:', { newName, newPower });
        const data = await fs.readFile(dataPath, 'utf8');
        if (data) {
            let users = JSON.parse(data);
            const userIndex = users.findIndex(user => user.name === currentName && user.message === currentPower);
            console.log(userIndex);
            if (userIndex === -1) {
                return res.status(404).json({ message: "User not found" })
            }
            users[userIndex] = { ...users[userIndex], name: newName, message: newPower };
            console.log(users);
            await fs.writeFile(dataPath, JSON.stringify(users, null, 2));

            res.status(200).json({ message: `You sent ${newName} and ${newPower}` });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('An error occurred while updating the user.');
    }
});
app.delete('/user/:name/:email', async (req, res) => {
    try {
        const { name, messages } = req.params;
        let users = [];
        // console.log(req.params);

        try {
            const data = await fs.readFile(dataPath, 'utf8');
            users = JSON.parse(data);
            console.log(users);
        } catch (error) {
            return res.status(404).send('User data not found');
        }

        const userIndex = users.findIndex(user => user.name === name && user.message === currentPower);
        console.log(userIndex);
        if (userIndex == -1) {
            return res.status(404).send('User not found');
        }
        users.splice(userIndex, 1);
        try {
            await fs.writeFile(dataPath, JSON.stringify(users, null, 2));
        } catch (error) {
            console.error("Failed to write to database");
        }
        res.send('User deleted successfully');
    } catch (error) {
        res.status(500).send('There was an error deleting user');
    }

});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});