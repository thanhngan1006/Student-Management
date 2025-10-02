import React from "react";

type Props = {};

const Unauthorized = (props: Props) => {
  return (
    <div className="text-center mt-20 text-red-600 text-xl">
      Bạn không có quyền truy cập trang này.
    </div>
  );
};

export default Unauthorized;
