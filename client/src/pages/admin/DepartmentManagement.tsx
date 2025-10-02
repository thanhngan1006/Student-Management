import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Department = {
  _id: string;
  name: string;
  code: string;
  email: string;
  phone_number: string;
  officeLocation: string;
  headofDepartment: string;
  members: {
    subject_id: string;
    subject_name?: string;
    subject_code: string;
    users: string[];
  }[];
};

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:4001/api/departments")
      .then((res) => setDepartments(res.data))
      .catch((err) => console.error("Lỗi khi lấy dữ liệu tổ:", err));
  }, []);

  return (
    <div className="w-full h-full p-4 overflow-y-auto bg-gray-50">
      <div className="w-9/12 mx-auto relative">
        <div className="grid grid-cols-3 gap-5">
          {departments.map((department) => (
            <Link
              to={`${department._id}`}
              className="overflow-hidden flex flex-col gap-2 p-4 h-60 border rounded-lg shadow-lg bg-white hover:bg-blue-50 transition duration-300 ease-in-out text-blue-800 cursor-pointer"
              key={department._id}
            >
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-lg text-center bg-blue-200 p-2 rounded-md shadow-sm">
                  {department.name}
                </h3>
              </div>

              <ul className="font-semibold text-center">
                {department.members.map((member, index) => (
                  <li key={index} className=" p-2">
                    {member.subject_name}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepartmentManagement;
