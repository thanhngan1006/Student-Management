import { useMemo, useState } from "react";
import { CiLogout } from "react-icons/ci";
import { MdChangeCircle } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { menuItems } from "../config/menuConfig";
import Header from "./Header";

const Sidebar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = Array.isArray(user.role) ? user.role[0] : user.role;
  const [selectedItem, setSelectedItem] = useState("");

  const isSubjectTeacher = useMemo(() => {
    return (
      user.role === "advisor" &&
      Array.isArray(user.advisor_type) &&
      !user.advisor_type.includes("homeroom_teacher")
    );
  }, [user]);

  const isHomeroomTeacher = useMemo(() => {
    return (
      user.role === "advisor" &&
      Array.isArray(user.advisor_type) &&
      !user.advisor_type.includes("subject_teacher")
    );
  }, [user]);

  const filteredMenuItems = menuItems.filter((item) => {
    if (isSubjectTeacher) {
      if (item.path === "studentScore") return false;
      if (item.path === "dashboard") return false;
      if (item.path === "students") return false;
      if (item.path === "forum") return false;
      if (item.path === "teacherdashboard") return false;
    } else {
    }

    if (isHomeroomTeacher) {
      if (item.path === "dashboard") return true;
      if (item.path === "students") return true;
      if (item.path === "forum") return true;
      if (item.path === "teacherdashboard") return true;
    } else {
    }

    return item.allowedRoles.includes(userRole);
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navigateToChangePasswordPage = () => {
    navigate(`/changePassword`);
  };

  return (
    <div className="h-full bg-blue-950 p-4 flex flex-col">
      <Header name={user.name} />

      <div className="flex-1 flex flex-col gap-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          // const fullPath = `/${userRole}/${item.path}`;
          const fullPath = `/${userRole}/${item.path}`;

          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(fullPath);
                setSelectedItem(item.path);
              }}
              className={`flex items-center gap-2 text-white p-3  cursor-pointer hover:bg-blue-900 rounded-md transition-colors ${
                selectedItem === item.path ? "bg-blue-900" : ""
              }`}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={navigateToChangePasswordPage}
        className="flex items-center gap-2 text-white p-3 hover:bg-blue-900 rounded-md mt-auto"
      >
        <MdChangeCircle />
        <span>Đổi mật khẩu</span>
      </button>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-white p-3 hover:bg-blue-900 rounded-md mt-auto"
      >
        <CiLogout />
        <span>Đăng xuất</span>
      </button>
    </div>
  );
};

export default Sidebar;
