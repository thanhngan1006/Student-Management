// const Post = require("../models/Post");
// const Comment = require("../models/Comment");
// const Feed = require("../models/Feed");
// const axios = require("axios");
// const nodemailer = require("nodemailer");

// exports.getPostsByClass = async (req, res) => {
//     try {
//       const { classId } = req.params;

//       const posts = await Post.find({ class_id: classId })
//         .sort({ created_at: -1 })
//         .populate("comments");

//       res.status(200).json(posts);
//     } catch (err) {
//       console.error("[Forum] Lỗi lấy bài viết theo lớp:", err);
//       res.status(500).json({ message: "Lỗi server" });
//     }
// };

// exports.createPost = async (req, res) => {
//     try {
//       const { author_id, author_name, content, role } = req.body;

//       let classRes;
//       if (role === 'student') {
//         classRes = await axios.get(`http://localhost:4000/api/students/${author_id}/class`);
//       } else if (role === 'advisor') {
//         classRes = await axios.get(`http://localhost:4000/api/teachers/${author_id}/class`);
//       } else {
//         return res.status(403).json({ message: 'Vai trò không hợp lệ để đăng bài' });
//       }

//       const class_id = classRes.data?.class?.class_id;
//       if (!class_id) {
//         return res.status(400).json({ message: "Không tìm thấy lớp học của người dùng" });
//       }

//       const newPost = new Post({ author_id, author_name, class_id, content });
//       const savedPost = await newPost.save();

//       let feed = await Feed.findOne({ class_id });
//       if (!feed) {
//         feed = new Feed({ class_id, posts: [savedPost._id] });
//       } else {
//         feed.posts.push(savedPost._id);
//       }
//       await feed.save();

//       const studentRes = await axios.get(`http://localhost:4000/api/classes/${class_id}/students`);
//       const students = studentRes.data?.students || [];
//       const emailList = students.map((s) => s.email).filter(Boolean);

//       const advisorRes = await axios.get(`http://localhost:4000/api/classes/${class_id}/advisor`);
//       const advisorEmail = advisorRes.data?.advisor?.email;
//       if (advisorEmail) emailList.push(advisorEmail);

//       const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: process.env.ADMIN_EMAIL,
//           pass: process.env.ADMIN_EMAIL_PASS,
//         },
//       });

//       await transporter.sendMail({
//         from: process.env.ADMIN_EMAIL,
//         to: emailList,
//         subject: `[Thông báo lớp ${class_id}] ${author_name} vừa đăng bài`,
//         html: `
//           <p><strong>${author_name}</strong> vừa đăng một bài viết mới trong diễn đàn lớp <strong>${class_id}</strong>.</p>
//           <p><em>Nội dung:</em></p>
//           <blockquote>${content}</blockquote>
//           <p>Vào hệ thống để xem chi tiết nhé!</p>
//         `,
//       });

//       res.status(201).json(savedPost);
//     } catch (err) {
//       console.error("[Forum] Lỗi tạo bài viết:", err.message);
//       res.status(500).json({ message: "Lỗi server" });
//     }
//   };

// exports.addComment = async (req, res) => {
//     try {
//       const { postId } = req.params;
//       const user = req.user;
//       if (!user || !user.id) {
//         return res.status(401).json({ message: "chưa đăng nhập hoặc token không hợp lệ" });
//       }
//       const { content } = req.body;

//       const newComment = new Comment({
//         post_id: postId,
//         author_id: user.id,
//         author_name: user.name,
//         content,
//       });

//       const savedComment = await newComment.save();

//       await Post.findByIdAndUpdate(postId, {
//         $push: { comments: savedComment._id },
//       });

//       res.status(201).json(savedComment);
//     } catch (err) {
//       console.error("[Forum] Lỗi thêm bình luận:", err.message);
//       res.status(500).json({ message: "Lỗi server" });
//     }
// };

// exports.toggleLike = async (req, res) => {
//     try {
//       const { postId } = req.params;
//       const { user_id } = req.body;

//       const post = await Post.findById(postId);
//       if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

//       const alreadyLiked = post.liked_by.includes(user_id);

//       if (alreadyLiked) {
//         post.liked_by = post.liked_by.filter(id => id !== user_id);
//       } else {
//         post.liked_by.push(user_id);
//       }

//       await post.save();
//       res.status(200).json({ liked: !alreadyLiked, totalLikes: post.liked_by.length });
//     } catch (err) {
//       console.error("[Forum] Lỗi toggle like:", err.message);
//       res.status(500).json({ message: "Lỗi server" });
//     }
// };

// exports.deletePost = async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const userId = req.user._id;

//     const post = await Post.findById(postId);
//     if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

//     if (post.author_id.toString() !== userId && req.user.role !== 'admin') {
//       return res.status(403).json({ message: "Bạn không có quyền xóa bài viết này" });
//     }

//     await Comment.deleteMany({ post_id: postId });

//     await Feed.findOneAndUpdate(
//       { class_id: post.class_id },
//       { $pull: { posts: post._id } }
//     );

//     await Post.findByIdAndDelete(postId);

//     res.status(200).json({ message: "Xóa bài viết thành công" });
//   } catch (err) {
//     console.error("[Forum] Lỗi xóa bài viết:", err.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Feed = require("../models/Feed");
const axios = require("axios");
const nodemailer = require("nodemailer");
require("dotenv").config();

exports.getPostsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const posts = await Post.find({ class_id: classId })
      .sort({ created_at: -1 })
      .populate("comments");

    res.status(200).json(posts);
  } catch (err) {
    console.error("[Forum] Lỗi lấy bài viết theo lớp:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { author_id, author_name, content, role } = req.body;

    let classRes;
    if (role === "student") {
      classRes = await axios.get(
        `${process.env.CLASS_SERVICE_URL}/api/students/${author_id}/class`
      );
    } else if (role === "advisor") {
      classRes = await axios.get(
        `${process.env.CLASS_SERVICE_URL}/api/teachers/${author_id}/class`
      );
    } else {
      return res
        .status(403)
        .json({ message: "Vai trò không hợp lệ để đăng bài" });
    }

    const class_id = classRes.data?.class?.class_id;
    if (!class_id) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy lớp học của người dùng" });
    }

    const newPost = new Post({ author_id, author_name, class_id, content });
    const savedPost = await newPost.save();

    let feed = await Feed.findOne({ class_id });
    if (!feed) {
      feed = new Feed({ class_id, posts: [savedPost._id] });
    } else {
      feed.posts.push(savedPost._id);
    }
    await feed.save();

    const studentRes = await axios.get(
      `${process.env.CLASS_SERVICE_URL}/api/classes/${class_id}/students`
    );
    const students = studentRes.data?.students || [];
    const emailList = students.map((s) => s.email).filter(Boolean);

    const advisorRes = await axios.get(
      `${process.env.CLASS_SERVICE_URL}/api/classes/${class_id}/advisor`
    );
    const advisorEmail = advisorRes.data?.advisor?.email;
    if (advisorEmail) emailList.push(advisorEmail);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASS,
      },
    });

    if (emailList.length > 0) {
      await transporter.sendMail({
        from: process.env.ADMIN_EMAIL,
        to: emailList,
        subject: `[Thông báo lớp ${class_id}] ${author_name} vừa đăng bài`,
        html: `
              <p><strong>${author_name}</strong> vừa đăng một bài viết mới trong diễn đàn lớp <strong>${class_id}</strong>.</p>
              <p><em>Nội dung:</em></p>
              <blockquote>${content}</blockquote>
              <p>Vào hệ thống để xem chi tiết nhé!</p>
            `,
      });
    }

    res.status(201).json(savedPost);
  } catch (err) {
    console.error(
      "[Forum] Lỗi tạo bài viết:",
      err.response?.data || err.message
    );
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const user = req.user;
    if (!user || !user.id) {
      return res
        .status(401)
        .json({ message: "chưa đăng nhập hoặc token không hợp lệ" });
    }
    const { content } = req.body;

    const newComment = new Comment({
      post_id: postId,
      author_id: user.id,
      author_name: user.name,
      content,
    });

    const savedComment = await newComment.save();

    await Post.findByIdAndUpdate(postId, {
      $push: { comments: savedComment._id },
    });

    res.status(201).json(savedComment);
  } catch (err) {
    console.error("[Forum] Lỗi thêm bình luận:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const { user_id } = req.body;

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ message: "Bài viết không tồn tại" });

    const alreadyLiked = post.liked_by.includes(user_id);

    if (alreadyLiked) {
      post.liked_by = post.liked_by.filter(
        (id) => id.toString() !== user_id.toString()
      );
    } else {
      post.liked_by.push(user_id);
    }

    await post.save();
    res
      .status(200)
      .json({ liked: !alreadyLiked, totalLikes: post.liked_by.length });
  } catch (err) {
    console.error("[Forum] Lỗi toggle like:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id; // Usually from token middleware

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài viết" });

    if (post.author_id.toString() !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa bài viết này" });
    }

    await Comment.deleteMany({ post_id: postId });

    await Feed.findOneAndUpdate(
      { class_id: post.class_id },
      { $pull: { posts: post._id } }
    );

    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Xóa bài viết thành công" });
  } catch (err) {
    console.error("[Forum] Lỗi xóa bài viết:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};
