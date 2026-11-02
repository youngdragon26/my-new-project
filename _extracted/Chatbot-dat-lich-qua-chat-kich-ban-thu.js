// Hội thoại đặt lịch khi ĐÃ đăng nhập (token ký bằng JWT_SECRET cho tài khoản test id 58).
// node booking.js [port] [kịch bản...]
require('D:/AI/duc-minh-backend/node_modules/dotenv').config({ path: 'D:/AI/duc-minh-backend/.env' });
const jwt = require('D:/AI/duc-minh-backend/node_modules/jsonwebtoken');
const PORT = process.argv[2] || 4100;
const token = jwt.sign({ id: 58, email: 'benhnhan.test@example.com', role: 'patient', name: 'Bệnh Nhân Test' }, process.env.JWT_SECRET, { expiresIn: '1h' });

const SCENARIOS = {
  anh: ['thân tuấn vũ 21 nam 0353012966', 'bị đau bụng', 'ngày 1 lúc 9h', 'không', 'ngày 2 lúc 9h'],
  datlich: ['tôi muốn đặt lịch khám', 'tôi bị đau họng', 'mai 9h', 'Trần Thị Mai, 25 tuổi, nữ, sđt 0987654321'],
  thieu: ['đặt lịch khám răng thứ 7 lúc 2h chiều', 'tên tôi là Lê Văn An', '0912345678', '45', 'nam'],
  sai: ['đặt lịch khám da liễu', 'ngày 30/2 lúc 21h', 'mai 9h15', 'mai 9h30', 'Hoàng Nam 0912345 40 tuổi nam', '0912345678'],
  sua: ['đặt lịch khám nội mai 10h, Phạm Văn Bình 50 tuổi nam 0911222333', 'mình muốn sửa lại thông tin đặt lịch', 'đổi sang 14h', 'Mình không muốn đặt lịch nữa, huỷ yêu cầu này giúp mình', 'giờ làm việc?'],
  xacnhan: ['thân tuấn vũ 21 nam 0353012966', 'bị đau bụng', 'ngày 1 lúc 9h', 'không', 'ngày 2 lúc 9h', 'Xác nhận, đặt lịch giúp mình', 'cảm ơn'],
  huy: ['tôi muốn đặt lịch khám tai mũi họng', 'thôi không đặt nữa'],
  khongdangnhap: null,
};

async function ask(message, history, auth = true) {
  const res = await fetch(`http://localhost:${PORT}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify({ message, history }),
  });
  const d = await res.json();
  return d.reply || d.error;
}

(async () => {
  const names = process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(SCENARIOS).filter((k) => SCENARIOS[k]);
  for (const name of names) {
    console.log(`===== ${name}`);
    const history = [];
    for (const m of SCENARIOS[name]) {
      const r = await ask(m, history);
      console.log(`> ${m}\n${r.replace(/^/gm, '  ')}\n`);
      history.push({ role: 'user', content: m }, { role: 'assistant', content: r });
    }
  }
})();
