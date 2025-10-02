import { FaHome } from "react-icons/fa";
import { GrSchedule, GrScorecard } from "react-icons/gr";
import { ImProfile } from "react-icons/im";
import {
  MdForum,
  MdOutlineClass,
  MdOutlineDashboardCustomize,
  MdOutlineScore,
} from "react-icons/md";

import React from "react";
import { FcAcceptDatabase } from "react-icons/fc";
import { IoMdInformationCircle } from "react-icons/io";
import { RxDashboard } from "react-icons/rx";
import { SiInformatica } from "react-icons/si";
import { Role } from "../types/auth";

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType;
  allowedRoles: Role[];
}

export const menuItems: MenuItem[] = [
  {
    path: "",
    label: "Trang chủ",
    icon: FaHome,
    allowedRoles: ["admin", "student", "advisor"],
  },

  {
    path: "forum",
    label: "Diễn đàn",
    icon: MdForum,
    allowedRoles: ["student", "advisor"],
  },
  {
    path: "profile",
    label: "Hồ sơ cá nhân",
    icon: ImProfile,
    allowedRoles: ["admin", "student", "advisor"],
  },
  {
    path: "databaseManagement",
    label: "Quản lý CSDL",
    icon: GrScorecard,
    allowedRoles: ["admin", "advisor"],
  },

  {
    path: "studentScore",
    label: "Bảng điểm học sinh",
    icon: MdOutlineScore,
    allowedRoles: ["advisor", "admin"],
  },

  {
    path: "schedule",
    label: "Thời khóa biểu",
    icon: GrSchedule,
    allowedRoles: ["admin"],
  },

  {
    path: "classForSubjectTeacher",
    label: "Lớp học",
    icon: MdOutlineClass,
    allowedRoles: ["advisor"],
  },

  {
    path: "dashboard",
    label: "Tổng quan",
    icon: RxDashboard,
    allowedRoles: ["advisor"],
  },

  {
    path: "personalScore",
    label: "Điểm cá nhân",
    icon: GrScorecard,
    allowedRoles: ["student"],
  },
  {
    path: "studentSchedule",
    label: "Thời khóa biểu",
    icon: GrSchedule,
    allowedRoles: ["student"],
  },
  {
    path: "students",
    label: "Thông tin học sinh",
    icon: IoMdInformationCircle,
    allowedRoles: ["advisor", "admin"],
  },
  {
    path: "department",
    label: "Quản lý phòng ban",
    icon: MdOutlineDashboardCustomize,
    allowedRoles: ["admin"],
  },
  {
    path: "advisorInfo",
    label: "Thông tin giáo viên",
    icon: SiInformatica,
    allowedRoles: ["admin"],
  },
  {
    path: "class",
    label: "Quản lý lớp học",
    icon: MdForum,
    allowedRoles: ["admin"],
  },
  {
    path: "schedule",
    label: "Thời khóa biểu",
    icon: GrSchedule,
    allowedRoles: ["advisor"],
  },
  {
    path: "teacherdashboard",
    label: "Xét duyệt",
    icon: FcAcceptDatabase,
    allowedRoles: ["advisor"],
  },
  {
    path: "admindashboard",
    label: "Xét duyệt",
    icon: FcAcceptDatabase,
    allowedRoles: ["admin"],
  },
];
