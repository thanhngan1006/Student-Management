import { useState } from "react";
import { Link } from "react-router-dom";
import classImg from "../../assets/classImg.jpg";
import { useClass } from "../../context/ClassContext";

const ClassManagement = () => {
  const {
    classes,
    setIsFormVisible,
    isFormVisible,
    handleClassNameChange,
    handleCreateClass,
    studentClass,
    error,
    setError,
  } = useClass();

  const [selectedGrade, setSelectedGrade] = useState<string>("Tất cả");
  const filteredClasses = classes.filter((classItem) => {
    if (selectedGrade === "Tất cả") return true;
    return classItem.class_name.startsWith(selectedGrade);
  });

  return (
    <div className="w-full h-full p-4 overflow-y-auto">
      <div className="w-9/12 mx-auto relative">
        <div className="flex justify-between items-center mb-4">
          <button
            className="bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-md"
            onClick={() => setIsFormVisible(true)}
          >
            Tạo lớp
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="gradeFilter" className="font-medium">
              Lọc theo khối:
            </label>
            <select
              id="gradeFilter"
              className="border p-2 rounded"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="Tất cả">Tất cả</option>
              <option value="Khối 10">Khối 10</option>
              <option value="Khối 11">Khối 11</option>
              <option value="Khối 12">Khối 12</option>
            </select>
          </div>
        </div>
        {isFormVisible && (
          <div className="p-4 border rounded shadow mb-4 w-2/3 bg-white">
            <input
              type="text"
              placeholder="Nhập tên lớp"
              value={studentClass?.class_id}
              onChange={handleClassNameChange}
              className="border p-2 rounded-md w-full "
            />
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md mt-2 cursor-pointer"
                onClick={handleCreateClass}
              >
                Xác nhận
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md mt-2 cursor-pointer"
                onClick={() => {
                  setError("");
                  setIsFormVisible(false);
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-5">
          {filteredClasses.map((classItem) => (
            <Link
              to={`${classItem.class_id}`}
              className="overflow-hidden p-4 h-40 border rounded shadow bg-white hover:bg-gray-100 text-blue-800 cursor-pointer"
              key={classItem.class_id}
            >
              <div className="flex flex-col gap-2">
                <h3 className="font-bold bg-blue-100 text-center rounded-sm">
                  {classItem.class_name + " - " + classItem.class_id}
                </h3>
                <div className="overflow-hidden rounded">
                  <img
                    className="w-full max-h-26 object-cover"
                    src={classImg}
                    alt="class"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClassManagement;
