const { exec } = require("child_process");

const runService = (name, command) => {
  console.log(`🚀 Đang khởi động ${name}...`);
  const process = exec(command);

  process.stdout.on("data", (data) => console.log(`[${name}] ${data}`));
  process.stderr.on("data", (data) => console.error(`[${name} LỖI] ${data}`));
};

runService("API Gateway", "cd api-gateway && npm start dev");

setTimeout(() => {
    const services = ["ClassService", "EducationService", "ScoreService", "UserService", "ForumService"];
    services.forEach(service => {
        runService(service, `cd services/${service} && npm start dev`);
    });
}, 2000);



