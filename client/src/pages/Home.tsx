import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { CiLogout } from "react-icons/ci";
import { FaUser } from "react-icons/fa";
import { FcAcceptDatabase } from "react-icons/fc";
import { GrSchedule, GrScorecard } from "react-icons/gr";
import { ImProfile } from "react-icons/im";
import { IoMdInformationCircle } from "react-icons/io";
import {
  MdForum,
  MdOutlineClass,
  MdOutlineDashboardCustomize,
  MdOutlineScore,
} from "react-icons/md";
import { RxDashboard } from "react-icons/rx";
import { SiInformatica } from "react-icons/si";
import { Link, useNavigate } from "react-router-dom";
import { useClass } from "../context/ClassContext";

const Home = () => {
  const CLASS_SERVICE_URL = import.meta.env.VITE_CLASS_SERVICE_URL;
  const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL;

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const role = user.role;
  const tdt_id = user.tdt_id;

  const [userDetail, setUserDetail] = useState<any>(null);
  const [advisor, setAdvisor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { studentClass, setStudentClass, classes } = useClass();

  console.log("cac lop duoc tao ", classes);

  const { isHomeroomTeacher } = useMemo(() => {
    if (!userDetail || userDetail.role !== "advisor") {
      return { isHomeroomTeacher: false, isSubjectTeacher: false };
    }

    const isSubjectTeacher = true;

    const isHomeroomTeacher =
      Array.isArray(userDetail.advisor_type) &&
      userDetail.advisor_type.includes("homeroom_teacher");

    return { isHomeroomTeacher, isSubjectTeacher };
  }, [userDetail]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${USER_SERVICE_URL}/api/users/tdt/${tdt_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const studentId = res.data._id;
        console.log("Student ID:", studentId);

        const fetchedUser = res.data;
        setUserDetail(fetchedUser);
        localStorage.setItem("user", JSON.stringify(fetchedUser));

        if (res.data.role === "student") {
          const advRes = await axios.get(
            `${CLASS_SERVICE_URL}/api/students/${studentId}/advisor`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          console.log("advRes o student", advRes);
          setAdvisor(advRes.data.advisor);
          setStudentClass(advRes.data.class);
        }
        if (fetchedUser.role === "advisor") {
          const advisorId = fetchedUser._id;

          if (fetchedUser.advisor_type.includes("homeroom_teacher")) {
            try {
              const classRes = await axios.get(
                `${CLASS_SERVICE_URL}/api/teachers/${advisorId}/class`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              setStudentClass(classRes.data.class);
            } catch (error) {
              console.error("Lỗi lấy thông tin lớp:", error);
            }
          }
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin người dùng:", err);
        navigate("/unauthorized");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [tdt_id, token, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;
  if (!userDetail) return <div>Không tìm thấy thông tin người dùng</div>;

  // --------------------------------------
  // STUDENT VIEW
  // --------------------------------------
  if (role === "student") {
    return (
      <div className="w-full h-full flex flex-col gap-20 p-4 overflow-y-auto">
        <div className="flex flex-col w-9/12 mx-auto">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl text-blue-950 font-semibold">
              Chào mừng <strong>{userDetail.name}</strong> đến với ứng dụng quản
              lý học sinh - giáo viên!
            </h1>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-9 p-4 bg-white rounded-lg shadow-xl flex flex-col gap-3">
                <div className="flex flex-col gap-8">
                  <h2 className="text-xl font-bold">Thông tin cá nhân</h2>
                  <div className="flex flex-col">
                    <p className="font-bold text-xl">Họ và tên</p>
                    <p className="text-xl">{userDetail.name}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="font-bold text-xl">Vai trò</p>
                    <p className="text-xl">{userDetail.role}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="font-bold text-xl">Lớp học</p>
                    <p className="text-xl">
                      {studentClass?.id} - {studentClass?.name}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-span-3 grid grid-cols-1 gap-4">
                <Link
                  to={`/${role}/profile`}
                  className="bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
                >
                  <FaUser className="w-12 h-12 text-purple-700" />
                  <span className="ml-2 text-xl">Thông tin cá nhân</span>
                </Link>
                <Link
                  to={`/${role}/schedule`}
                  className="bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
                >
                  <GrSchedule className="w-12 h-12 text-amber-600" />
                  <span className="ml-2 text-xl">Thời khóa biểu</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-white p-4 rounded-lg shadow-md flex items-center flex-col w-full"
                >
                  <CiLogout className="w-12 h-12 text-red-600" />
                  <span className="ml-2 text-xl">Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col w-9/12 mx-auto">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl text-blue-950 font-semibold">
              Giáo viên và theo dõi điểm
            </h1>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-9 p-4 bg-white rounded-lg shadow-xl flex flex-col gap-3">
                {advisor ? (
                  <div className="flex flex-col gap-8">
                    <h2 className="text-xl font-bold">Thông tin giáo viên</h2>
                    <div className="flex flex-col">
                      <p className="font-bold text-xl">Họ và tên</p>
                      <p className="text-xl">{advisor.name}</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="font-bold text-xl">Vai trò</p>
                      <p className="text-xl">
                        {advisor.role === "advisor"
                          ? "giáo viên học tập"
                          : "Không xác định"}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <p className="font-bold text-xl">Số điện thoại</p>
                      <p className="text-xl">
                        {advisor.phone_number?.startsWith("0")
                          ? advisor.phone_number
                          : "0" + advisor.phone_number}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <p className="font-bold text-xl">Email</p>
                      <p className="text-xl">{advisor.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-500">
                    Không tìm thấy thông tin giáo viên.
                  </p>
                )}
              </div>
              <div className="col-span-3 grid grid-cols-1 gap-4">
                <Link
                  to={`/${role}/forum`}
                  className="bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
                >
                  <MdForum className="w-12 h-12 text-amber-400" />
                  <span className="ml-2 text-xl">Diễn đàn</span>
                </Link>
                <Link
                  to={`/${role}/personalScore`}
                  className="bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
                >
                  <GrScorecard className="w-12 h-12 text-green-400" />
                  <span className="ml-2 text-xl">Bảng điểm cá nhân</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------
  // ADMIN VIEW
  // --------------------------------------
  if (role === "admin") {
    return (
      <div className="w-full h-full flex flex-col gap-20 p-4 overflow-y-auto">
        <div className="flex flex-col w-9/12 mx-auto">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl text-blue-950 font-semibold">
              Chào mừng {userDetail.name} đến với ứng dụng quản lý học sinh -
              giáo viên!
            </h1>
            <div className="grid grid-cols-12 gap-4 bg-white rounded-lg shadow-xl relative">
              <div className="col-span-10 p-4   flex flex-col gap-3">
                <div className="flex flex-col gap-8">
                  <h2 className="text-xl font-bold">Thông tin cá nhân</h2>
                  <div className="flex flex-col">
                    <p className="font-bold text-xl">Họ và tên</p>
                    <p className="text-xl">{userDetail.name}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="font-bold text-xl">Vai trò</p>
                    <p className="text-xl">{userDetail.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col w-9/12 mx-auto">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl text-blue-950 font-semibold">Tiện ích</h1>
            <div className="grid grid-cols-12 gap-4">
              <Link
                to={`/${role}/class`}
                className="col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
              >
                <MdForum className="w-12 h-12 text-amber-400" />
                <span className="ml-2 text-xl">Quản lý lớp học</span>
              </Link>
              <Link
                to={`/${role}/advisorInfo`}
                className="col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
              >
                <SiInformatica className="w-12 h-12 text-black-400" />
                <span className="ml-2 text-xl">Thông tin giáo viên</span>
              </Link>
              <Link
                to={`/${role}/students`}
                className="col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
              >
                <IoMdInformationCircle className="w-12 h-12 text-purple-400" />
                <span className="ml-2 text-xl">Thông tin học sinh</span>
              </Link>
              <Link
                to={`/${role}/studentScore`}
                className="col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
              >
                <MdOutlineScore className="w-12 h-12 text-blue-400" />
                <span className="ml-2 text-xl">Bảng điểm</span>
              </Link>

              <Link
                to={`/${role}/databaseManagement`}
                className=" col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
              >
                <GrScorecard className="w-12 h-12 text-green-400" />
                <span className="ml-2 text-xl">Quản lý CSDL</span>
              </Link>
              <Link
                to={`/${role}/department`}
                className=" col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
              >
                <MdOutlineDashboardCustomize className="w-12 h-12 text-pink-400" />
                <span className="ml-2 text-xl">Quản lý phòng ban</span>
              </Link>
              <Link
                to={`/${role}/profile`}
                className=" col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
              >
                <ImProfile className="w-12 h-12 text-red-400" />
                <span className="ml-2 text-xl">Hồ sơ cá nhân</span>
              </Link>
              <Link
                to={`/${role}/schedule`}
                className=" col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
              >
                <GrSchedule className="w-12 h-12 text-amber-600" />
                <span className="ml-2 text-xl">Thời khóa biểu</span>
              </Link>

              <Link
                to={`/${role}/admindashboard`}
                className=" col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
              >
                <FcAcceptDatabase className="w-12 h-12 text-blue-900" />
                <span className="ml-2 text-xl">Xét duyệt</span>
              </Link>
              {/* <button
                onClick={handleLogout}
                className="col-span-4 bg-white p-4 rounded-lg shadow-md flex items-center flex-col w-full"
              >
                <CiLogout className="w-12 h-12 text-red-600" />
                <span className="ml-2 text-xl">Đăng xuất</span>
              </button> */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------
  // ADVISOR VIEW
  // --------------------------------------
  if (role === "advisor") {
    return (
      <div className="w-full h-full flex flex-col gap-20 p-4 overflow-y-auto">
        <div className="flex flex-col w-9/12 mx-auto">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl text-blue-950 font-semibold">
              Chào mừng <strong>{userDetail.name}</strong> đến với ứng dụng quản
              lý học sinh - giáo viên!
            </h1>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 p-4 bg-white rounded-lg shadow-xl flex flex-col gap-3">
                <div className="flex flex-col gap-8">
                  <h2 className="text-xl font-bold">Thông tin cá nhân</h2>
                  <div className="flex flex-col">
                    <p className="font-bold text-xl">Họ và tên</p>
                    <p className="text-xl">{userDetail.name}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="font-bold text-xl">Vai trò</p>
                    <p className="text-xl">
                      {" "}
                      {isHomeroomTeacher
                        ? "Giáo viên chủ nhiệm"
                        : "Giáo viên bộ môn"}
                    </p>
                  </div>
                  {isHomeroomTeacher && (
                    <div className="flex flex-col">
                      <p className="font-bold text-xl">Lớp chủ nhiệm</p>
                      <p className="text-xl">
                        {studentClass?.class_id} - {studentClass?.class_name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col w-9/12 mx-auto">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl text-blue-950 font-semibold">Tiện ích</h1>
            <div className="grid grid-cols-12 gap-4">
              <Link
                to={`/${role}/schedule`}
                className=" col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
              >
                <GrSchedule className="w-12 h-12 text-amber-600" />
                <span className="ml-2 text-xl">Thời khóa biểu</span>
              </Link>
              {isHomeroomTeacher ? (
                <Link
                  to={`/${role}/studentScore`}
                  className="col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
                >
                  <MdOutlineScore className="w-12 h-12 text-blue-400" />
                  <span className="ml-2 text-xl">Bảng điểm</span>
                </Link>
              ) : null}

              {isHomeroomTeacher ? (
                <Link
                  to={`/${role}/dashboard`}
                  className="col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
                >
                  <RxDashboard className="w-12 h-12 text-amber-800" />
                  <span className="ml-2 text-xl">Tổng quan</span>
                </Link>
              ) : null}

              {isHomeroomTeacher ? (
                <Link
                  to={`/${role}/teacherdashboard`}
                  className=" col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
                >
                  <FcAcceptDatabase className="w-12 h-12 text-blue-900" />
                  <span className="ml-2 text-xl">Xét duyệt</span>
                </Link>
              ) : null}

              {isHomeroomTeacher ? (
                <Link
                  to={`/${role}/forum`}
                  className="col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
                >
                  <MdForum className="w-12 h-12 text-amber-400" />
                  <span className="ml-2 text-xl">Diễn đàn</span>
                </Link>
              ) : null}

              {isHomeroomTeacher ? (
                <Link
                  to={`/${role}/students`}
                  className="col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
                >
                  <IoMdInformationCircle className="w-12 h-12 text-purple-400" />
                  <span className="ml-2 text-xl">Thông tin học sinh</span>
                </Link>
              ) : null}

              <Link
                to={`/${role}/databaseManagement`}
                className=" col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
              >
                <GrScorecard className="w-12 h-12 text-green-400" />
                <span className="ml-2 text-xl">Quản lý CSDL</span>
              </Link>
              <Link
                to={`/${role}/profile`}
                className=" col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
              >
                <ImProfile className="w-12 h-12 text-pink-400" />
                <span className="ml-2 text-xl">Hồ sơ cá nhân</span>
              </Link>
              <Link
                to={`/${role}/classForSubjectTeacher`}
                className=" col-span-4 bg-white p-4 rounded-lg shadow-md flex justify-center items-center flex-col gap-2"
              >
                <MdOutlineClass className="w-12 h-12 text-red-400" />
                <span className="ml-2 text-xl">Lớp học</span>
              </Link>

              {/* <button
                onClick={handleLogout}
                className="col-span-4 bg-white p-4 rounded-lg shadow-md flex items-center flex-col w-full"
              >
                <CiLogout className="w-12 h-12 text-red-600" />
                <span className="ml-2 text-xl">Đăng xuất</span>
              </button> */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div>Role không hợp lệ</div>;
};

export default Home;
