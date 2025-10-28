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
    const keyword = req.query.search;
    let filter = {};
    if (keyword) {
      filter = {
        $or: [
          { username: { $regex: keyword, $options: 'i' } },
          { email: { $regex: keyword, $options: 'i' } }
        ]
      };
    }
    const users = await User.find(filter).select('-password'); 
    res.json(users);
  } catch (error) {
    console.error('Lỗi khi lấy users:', error); // Thêm log lỗi
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    // 1. Lấy TẤT CẢ các trường có thể có từ request
    const { username, password, image } = req.body;
    
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    // 2. Cập nhật các trường
    user.username = username || user.username;
    
    // 3. Cập nhật mật khẩu (NẾU có mật khẩu mới được gửi)
    if (password) {
      user.password = password; // Hook pre-save trong Model sẽ tự động băm mật khẩu
    }

    // 4. Cập nhật ảnh (Quan trọng)
    // Phải kiểm tra 'image' CÓ TỒN TẠI trong request hay không
    // (Vì 'image: null' là một giá trị hợp lệ, nghĩa là 'xóa ảnh')
    if ('image' in req.body) {
      user.image = image; 
    }

    // 5. Lưu lại user
    const updatedUser = await user.save();
    
    // Trả về user đã cập nhật (không kèm mật khẩu)
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      image: updatedUser.image,
    });

  } catch (error) {
    console.error('LỖI KHI CẬP NHẬT:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật user' });
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
