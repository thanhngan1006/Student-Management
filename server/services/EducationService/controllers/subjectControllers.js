const Subject = require("../models/Subject");
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');


exports.getAllSubjects = async (req, res) => {
    const subjects = await Subject.find();
    res.status(200).json(subjects);
};

exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Không tìm thấy môn học' });
    }
    res.json(subject);
  } catch (error) {
    console.error("Lỗi khi lấy subject theo id:", error.message);
    res.status(500).json({ message: 'Lỗi server khi lấy môn học' });
  }
};

exports.getSubjectsByIds = async (req, res) => {
    try {
      const { ids } = req.body;
  
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Danh sách id không hợp lệ' });
      }
  
      const subjects = await Subject.find({ _id: { $in: ids } });
  
      res.status(200).json(subjects);
    } catch (error) {
      console.error('[SubjectService LỖI] [Lỗi lấy batch subject]:', error.message);
      res.status(500).json({ message: 'Lỗi server khi lấy danh sách môn học' });
    }
  };
  
  exports.importSubjects = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng tải lên file CSV hoặc XLSX' });
      }
  
      const ext = req.file.originalname.split('.').pop().toLowerCase();
      let data = [];
  
      if (ext === 'csv') {
        const rows = [];
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => rows.push(row))
          .on('end', async () => {
            console.log('[DEBUG] Đọc CSV xong, số dòng:', rows.length);
            await saveSubjects(rows, res);
          });
      } else if (ext === 'xlsx') {
        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        data = xlsx.utils.sheet_to_json(sheet);
        console.log('[DEBUG] Đọc XLSX xong, số dòng:', data.length);
        await saveSubjects(data, res);
      } else {
        return res.status(400).json({ message: 'Định dạng file không hợp lệ (chỉ hỗ trợ CSV hoặc XLSX)' });
      }
    } catch (err) {
      console.error('[Import Subjects ERROR]', err.message);
      res.status(500).json({ message: 'Lỗi server khi import' });
    }
  };
  
  async function saveSubjects(subjects, res) {
    const inserted = [];
  
    for (const s of subjects) {
      const name = s['subject_name']?.toString().trim() || s['﻿subject_name']?.toString().trim();
      const code = s['subject_code']?.toString().trim();
    
      if (!name || !code) {
        console.log('[BỎ QUA]', s);
        continue;
      }
  
      const exists = await Subject.findOne({ subject_code: code });
      if (exists) {
        console.log('[ĐÃ TỒN TẠI]', code);
        continue;
      }
  
      const newSubject = new Subject({
        subject_name: name,
        subject_code: code,
      });
  
      const saved = await newSubject.save();
      inserted.push(saved);
    }
  
    res.status(200).json({
      message: `Đã thêm ${inserted.length} môn học`,
      inserted
    });
  }
  
  exports.getSubjectByCode = async (req, res) => {
    try {
      const subject = await Subject.findOne({ subject_code: req.params.code });
  
      if (!subject) {
        return res.status(404).json({ message: 'Không tìm thấy môn học' });
      }
  
      res.status(200).json(subject);
    } catch (err) {
      console.error('[ERROR] Lấy môn học theo code:', err.message);
      res.status(500).json({ message: 'Lỗi server khi lấy môn học' });
    }
  };
  