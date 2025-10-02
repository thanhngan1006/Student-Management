import logo from "../assets/logo.png";

type Props = {
  name: string;
};

const Header = ({ name }: Props) => {
  return (
    <div className="flex items-center gap-2 mb-8">
      <img src={logo} alt="Logo" className="w-10 h-10" />
      <div className="text-white">
        <h1 className="font-bold">Hệ thống HS - GV</h1>
        <p className="text-sm opacity-80">{name}</p>
      </div>
    </div>
  );
};

export default Header;
