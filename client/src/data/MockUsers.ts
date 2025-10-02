import { AdminType } from "../types/admin";
import { AdvisorType } from "../types/advisor";
import { StudentType } from "../types/student";

export const MockUsers = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    name: "Admin",
    role: "admin",
    email: "admin@gmail.com",
  },
  {
    id: "2",
    username: "52200131",
    password: "student123",
    name: "Võ Thị Thanh Ngân",
    role: "student",
    email: "52200131@student.tdtu.edu.vn",
  },
  {
    id: "3",
    username: "advisor",
    password: "advisor123",
    name: "giáo viên A",
    role: "advisor",
    email: "advisor@gmail.com",
  },
];

export const MockAdmins: Record<string, AdminType> = {
  "1": {
    id: "1",
    name: "Admin",
    role: "admin",
    email: "admin@example.com",
  },
};

export const MockStudents: Record<string, StudentType> = {
  "2": {
    tdt_id: "2",
    name: "Võ Thị Thanh Ngân",
    role: "student",
    gender: "Nữ",
    phoneNumber: "0901234567",
    parentPhoneNumber: "0912345678",
    address: "123 Lê Lợi, Q.1",
    dateOfBirth: new Date("2004-10-06"),
    email: "52200131@student.tdtu.edu.vn",
    advisorId: "3",
    class: "22050201",
  },
};

export const MockAdvisors: Record<string, AdvisorType> = {
  "3": {
    id: "3",
    name: "Dương Hữu Phúc",
    role: "advisor",
    phoneNumber: "0909090909",
    department: "CNTT",
    email: "advisor@gmail.com",
  },
};
