require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && await user.matchPassword(password)) {
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/users/add', async (req, res) => {
    const { username, email, password, image } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User đã tồn tại' });
        }
        const user = new User({ username, email, password, image });
        const createdUser = await user.save();
        res.status(201).json(createdUser);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { username, email, password, image } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.username = username || user.username;
            user.email = email || user.email;

            const uppdatedUser = await user.save();
            res.json(uppdatedUser);
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy user' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 6. API XÓA USER (Phiên bản tốt nhất)
app.delete('/api/users/:id', async (req, res) => {

  console.log(`\n\n[BACKEND] Đã nhận yêu cầu XÓA user với ID: ${req.params.id}\n\n`);

  try {
    
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
     
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

  
    res.json({ message: 'Xóa user thành công' });

  } catch (error) {
    console.error('LỖI KHI XÓA:', error); 
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
