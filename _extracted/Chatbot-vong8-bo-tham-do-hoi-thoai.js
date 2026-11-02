// Thăm dò hội thoại nhiều lượt: gửi lần lượt từng tin, giữ lịch sử, tự gắn cờ câu trả lời đáng ngờ.
// node probe.js [port] [filter]
const PORT = process.argv[2] || 4100;
const FILTER = process.argv[3] ? new RegExp(process.argv[3], 'i') : null;
const NOI = /Nội tổng quát/i, TMH = /Tai\s*[–-]\s*Mũi\s*[–-]\s*Họng/i, RHM = /Răng\s*[–-]\s*Hàm/i, DA = /Da liễu/i, NHI = /Nhi khoa/i, SAN = /Sản phụ khoa/i;
const WHY = /vì|lý do|do |nên/i;
const CHUA_CO = /chưa có (?:chuyên )?khoa/i;

// [tên, [tin...], kiểm tra cho tin CUỐI: {must:[], mustNot:[]}]
const S = [
  // ---- Ca gốc trong ảnh ----
  ['goc-1', ['tôi bị đau đầu gối', 'tại sao lại khám khoa nội tổng quát', 'tại sao không thể khám khao khác'], { must: [/6 chuyên khoa|chuyên khoa:/i, CHUA_CO] }],
  ['goc-2', ['tôi bị đau đầu gối'], { must: [NOI, CHUA_CO] }],
  ['goc-3', ['tôi bị đau đầu gối', 'tại sao lại khám khoa nội tổng quát'], { must: [/đầu gối/i, CHUA_CO] }],
  ['goc-4', ['toi bi dau dau goi', 'tai sao lai kham khoa noi'], { must: [/đầu gối/i], mustNot: [TMH] }],
  ['goc-5', ['đầu gối tôi sưng và đau khi leo cầu thang', 'vì sao vậy'], { mustNot: [/^Bạn nên khám chuyên khoa Nội tổng quát\.\s*$/] }],
  // ---- Hỏi lý do, nhiều cách nói ----
  ['why-1', ['tôi bị đau lưng', 'sao lại là khoa nội'], { must: [/đau lưng/i] }],
  ['why-2', ['tôi bị đau vai gáy', 'lý do gì mà khám khoa nội'], { must: [/vai|gáy/i] }],
  ['why-3', ['tôi bị mất ngủ kéo dài', 'tại sao khám nội mà không phải thần kinh'], { must: [/Thần kinh/i] }],
  ['why-4', ['tôi bị tiểu buốt', 'vì sao khám nội tổng quát'], { must: [/Tiết niệu/i] }],
  ['why-5', ['tôi bị trĩ', 'tại sao không có khoa riêng'], { must: [NOI] }],
  ['why-6', ['tôi bị huyết áp cao', 'tại sao lại khám nội'], { must: [/Tim mạch|huyết áp/i] }],
  ['why-7', ['tôi bị đau họng', 'tại sao lại khám tai mũi họng'], { must: [TMH, /họng/i] }],
  ['why-8', ['con tôi 3 tuổi bị sốt', 'tại sao phải khám nhi'], { must: [NHI, /trẻ em/i] }],
  ['why-9', ['tôi bị trễ kinh 2 tuần', 'vì sao khám sản phụ khoa'], { must: [SAN] }],
  ['why-10', ['tôi bị nổi mẩn ngứa', 'tại sao khám da liễu'], { must: [DA] }],
  ['why-11', ['tôi bị sâu răng', 'tại sao khám răng hàm mặt'], { must: [RHM] }],
  ['why-12', ['tôi bị đau đầu gối', 'có chắc không'], { must: [/đầu gối/i] }],
  ['why-13', ['tôi bị đau đầu gối', 'khoa đó có đúng không'], { must: [NOI] }],
  ['why-14', ['tôi bị đau đầu gối', 'bác sĩ nội có khám được đầu gối không'], { must: [CHUA_CO] }],
  ['why-15', ['tôi bị đau khớp tay', 'bác sĩ đó có chữa được không'], { must: [NOI] }],
  ['why-16', ['toi bi dau lung', 'vi sao kham noi'], { must: [NOI], mustNot: [TMH] }],
  ['why-17', ['tôi bị đau dạ dày', 'tại sao khám nội'], { must: [/dạ dày/i] }],
  ['why-18', ['tôi bị tê tay chân', 'sao lại khám nội vậy'], { must: [/Thần kinh/i] }],
  ['why-19', ['tôi bị đau đầu', 'tại sao lại khám nội tổng quát'], { must: [/đau đầu/i], mustNot: [/gối/i] }],
  ['why-20', ['tôi bị ho có đờm', 'tại sao khám khoa này'], { must: [/ho/i] }],
  ['why-21', ['tôi bị viêm xoang', 'tại sao khoa tai mũi họng'], { must: [TMH] }],
  ['why-22', ['bé nhà tôi bị sâu răng', 'sao không khám nhi'], { must: [RHM] }],
  ['why-23', ['tôi đang mang thai bị ho', 'sao lại khám sản mà không khám nội'], { must: [SAN] }],
  ['why-24', ['tôi bị đau gối', 'tại sao'], {}],
  ['why-25', ['tôi bị bong gân cổ chân', 'tại sao khám nội tổng quát'], { must: [CHUA_CO] }],
  // ---- Đòi khoa khác ----
  ['other-1', ['tôi bị đau đầu gối', 'khám khoa khác được không'], { must: [/6 chuyên khoa|chuyên khoa:/i] }],
  ['other-2', ['tôi bị đau đầu gối', 'tôi không muốn khám nội'], { must: [NOI] }],
  ['other-3', ['tôi bị đau đầu gối', 'tôi muốn đổi sang khoa da liễu'], { must: [DA, NOI] }],
  ['other-4', ['tôi bị đau họng', 'khám nội được không'], { must: [TMH] }],
  ['other-5', ['tôi bị đau lưng', 'có chuyên khoa nào khác không'], { must: [NOI] }],
  ['other-6', ['con tôi bị ho', 'khám nội được không'], { must: [NHI] }],
  ['other-7', ['tôi bị nổi mẩn', 'sang tai mũi họng được không'], { must: [DA] }],
  ['other-8', ['tôi bị đau răng', 'đi chỗ khác được không'], { must: [RHM] }],
  ['other-9', ['tôi bị đau đầu gối', 'tại sao không thể khám khoa khác'], { must: [NOI] }],
  ['other-10', ['tôi bị đau đầu gối', 'tai sao khong the kham khoa khac'], { must: [NOI] }],
  // ---- Hỏi khoa không có ----
  ['miss-1', ['phòng khám có khoa cơ xương khớp không'], { must: [CHUA_CO, NOI] }],
  ['miss-2', ['có bác sĩ chuyên về xương khớp không'], { must: [CHUA_CO] }],
  ['miss-3', ['tôi muốn khám tim mạch'], { must: [CHUA_CO] }],
  ['miss-4', ['có khoa thần kinh không'], { must: [CHUA_CO] }],
  ['miss-5', ['phòng khám có khám tiết niệu không'], { must: [CHUA_CO] }],
  ['miss-6', ['có khoa nam khoa không'], { must: [CHUA_CO] }],
  ['miss-7', ['có khám nội tiết không'], { must: [CHUA_CO] }],
  ['miss-8', ['có khoa chấn thương chỉnh hình không'], { must: [CHUA_CO] }],
  ['miss-9', ['co khoa co xuong khop khong'], { must: [CHUA_CO] }],
  ['miss-10', ['tôi bị đau đầu gối', 'có khoa cơ xương khớp không'], { must: [CHUA_CO] }],
  ['miss-11', ['có khoa tâm lý không'], { must: [CHUA_CO] }],
  ['miss-12', ['có khoa tiêu hóa không'], { must: [CHUA_CO] }],
  ['miss-13', ['có khoa nhi không'], { must: [NHI], mustNot: [CHUA_CO] }],
  ['miss-14', ['có khoa da liễu không'], { must: [DA], mustNot: [CHUA_CO] }],
  // ---- Triệu chứng xương khớp mới ----
  ['mx-1', ['tôi bị thoái hóa cột sống'], { must: [NOI, CHUA_CO] }],
  ['mx-2', ['tôi bị thoát vị đĩa đệm'], { must: [NOI] }],
  ['mx-3', ['tôi hay bị chuột rút bắp chân'], { must: [NOI] }],
  ['mx-4', ['tôi bị đau gót chân khi đi bộ'], { must: [NOI] }],
  ['mx-5', ['cổ tay tôi bị sưng đau'], { must: [NOI] }],
  ['mx-6', ['tôi bị gãy tay'], { must: [/115|cơ sở y tế/] }],
  ['mx-7', ['tôi bị trật khớp vai'], { must: [/115|cơ sở y tế/] }],
  ['mx-8', ['dau dau goi qua'], { must: [NOI], mustNot: [/đau đầu"/] }],
  ['mx-9', ['mẹ tôi 70 tuổi bị loãng xương'], { must: [NOI] }],
  ['mx-10', ['tôi bị viêm khớp dạng thấp'], { must: [NOI] }],
  ['mx-11', ['nhức đầu gối mỗi khi trời lạnh'], { must: [NOI] }],
  ['mx-12', ['tôi bị đau đầu dữ dội'], { must: [/115/] }],
  // ---- Ngữ cảnh tiếp tục sau khi giải thích ----
  ['ctx-1', ['tôi bị đau đầu gối', 'tại sao lại khám nội', 'vậy giá khám bao nhiêu'], { must: [/đ\b|\d/] }],
  ['ctx-2', ['tôi bị đau đầu gối', 'tại sao lại khám nội', 'bác sĩ nào khám'], { must: [/BS|bác sĩ/i] }],
  ['ctx-3', ['tôi bị đau đầu gối', 'tại sao lại khám nội', 'ngày mai còn lịch không'], { must: [/\d{2}:\d{2}/] }],
  ['ctx-4', ['tôi bị đau đầu gối', 'tại sao lại khám nội', 'ok'], { mustNot: [/Bạn là ai/] }],
  ['ctx-5', ['tôi bị đau đầu gối', 'khám khoa khác được không', 'thôi được rồi, khám nội vậy'], {}],
  ['ctx-6', ['tôi bị đau đầu gối', 'tại sao lại khám nội', 'tôi vẫn chưa hiểu'], {}],
  ['ctx-7', ['tôi bị đau đầu gối', 'đau đầu gối có nguy hiểm không'], {}],
  ['ctx-8', ['tôi bị đau đầu gối', 'tôi nên làm gì ở nhà'], {}],
  ['ctx-9', ['tôi bị đau đầu gối', 'có cần chụp x quang không'], {}],
  ['ctx-10', ['tôi bị đau đầu gối', 'tại sao lại khám nội', 'nếu khám nội không khỏi thì sao'], {}],
  ['ctx-11', ['tôi bị đau họng', 'tại sao', 'vậy có cần kiêng gì không'], {}],
  ['ctx-12', ['con tôi bị sốt', 'tại sao không khám nội', 'bé 5 tuổi'], { must: [NHI] }],
  ['ctx-13', ['tôi bị đau lưng', 'tại sao lại khám nội', 'tại sao lại khám nội'], { must: [NOI] }],
  ['ctx-14', ['tôi bị đau đầu gối', 'tại sao lại khám nội', 'vì sao không có khoa xương khớp'], {}],
  ['ctx-15', ['tôi bị đau đầu gối', 'tại sao lại khám nội', 'cảm ơn'], {}],
  // ---- Không được nhận nhầm là câu hỏi tiếp nối ----
  ['neg-1', ['sao phải đăng nhập mới đặt lịch được'], { mustNot: [/Mình gợi ý chuyên khoa/] }],
  ['neg-2', ['con tôi bị đau tai sao mãi không khỏi'], { must: [NHI] }],
  ['neg-3', ['tai sao toi bi ho mai khong khoi'], { mustNot: [TMH] }],
  ['neg-4', ['tôi bị ù tai sao vậy'], { must: [TMH] }],
  ['neg-5', ['khám da liễu được không'], { must: [DA] }],
  ['neg-6', ['tôi khao khát khỏe mạnh'], {}],
  ['neg-7', ['chắc chắn là mai mở cửa chứ'], {}],
  ['neg-8', ['có khám tim cho trẻ em không'], {}],
  ['neg-9', ['tim tôi đập nhanh'], { must: [NOI] }],
  ['neg-10', ['bác sĩ có khám ngày chủ nhật không'], { must: [/hẹn trước|Chủ nhật/i] }],
  // ---- Các khoa khác: hỏi tiếp lý do ----
  ['sp-1', ['mũi tôi bị chảy máu cam', 'sao không khám nội'], { must: [TMH] }],
  ['sp-2', ['tôi bị nấm da', 'khám nội được không'], { must: [DA] }],
  ['sp-3', ['tôi bị nhiệt miệng', 'tại sao khám răng hàm mặt'], { must: [RHM] }],
  ['sp-4', ['tôi bị ra khí hư nhiều', 'tại sao không khám da liễu'], { must: [SAN] }],
  ['sp-5', ['bé 2 tuổi bị phát ban', 'sao không khám da liễu'], {}],
  ['sp-6', ['tôi bị rụng tóc nhiều', 'tại sao lại khám da liễu'], { must: [DA] }],
  ['sp-7', ['tôi bị điếc tai', 'vì sao khám tai mũi họng'], { must: [TMH] }],
  ['sp-8', ['tôi bị đau bụng kinh', 'tại sao không khám nội'], { must: [SAN] }],
  ['sp-9', ['tôi bị viêm lợi', 'khám tai mũi họng được không'], { must: [RHM] }],
  ['sp-10', ['tôi bị mụn trứng cá', 'tại sao'], { must: [DA] }],
  // ---- Gõ sai, teencode ----
  ['ty-1', ['e bị đau đầu gối', 'tai sao lai kham noi z'], { must: [NOI] }],
  ['ty-2', ['đau đầu gốii quá', 'sao lại khám nội vậy bn'], { must: [NOI] }],
  ['ty-3', ['mk bị đau lưng', 'khám khao khác dc ko'], { must: [NOI] }],
  ['ty-4', ['dau lung qua', 'co chac khong'], { must: [NOI] }],
  ['ty-5', ['đau gối', 'why'], {}],
  ['ty-6', ['tôi bị đau đầu gối', 'tạisao'], {}],
  ['ty-7', ['tôi bị đau đầu gối', 'sao v'], {}],
  ['ty-8', ['tôi bị đau đầu gối', 'là sao'], {}],
  ['ty-9', ['tôi bị đau đầu gối', 'hả, sao lại nội'], { must: [NOI] }],
  ['ty-10', ['tôi bị đau đầu gối', 'nội tổng quát là khoa gì'], { must: [NOI] }],
  ['ty-11', ['tôi bị đau đầu gối', 'khoa nội tổng quát khám những gì'], { must: [NOI] }],
  ['ty-12', ['tôi bị đau đầu gối', 'bác sĩ nội có biết về xương khớp không'], { must: [NOI] }],
  // ---- Vòng 3: câu model từng bịa ----
  ['r3-1', ['tôi bị đau đầu gối', 'đau đầu gối có nguy hiểm không'], { must: [/bác sĩ/], mustNot: [/không (?:phải là )?(?:tình trạng )?nghiêm trọng|không nguy hiểm/i] }],
  ['r3-2', ['tôi bị đau đầu gối', 'nội tổng quát là khoa gì'], { mustNot: [/mọi chuyên khoa/i] }],
  ['r3-3', ['tôi bị đau đầu gối', 'bác sĩ nội có biết về xương khớp không'], { must: [CHUA_CO], mustNot: [/đã có chuyên môn/i] }],
  ['r3-4', ['có khám tim cho trẻ em không'], { must: [NHI] }],
  ['r3-5', ['khám cho trẻ em giá bao nhiêu'], { must: [/đ/] }],
  ['r3-6', ['khoa nhi khám những bệnh gì'], { must: [/trẻ em/i] }],
  ['r3-7', ['răng hàm mặt chuyên về gì'], { must: [/răng/i] }],
  ['r3-8', ['tôi bị đau lưng', 'có nặng không'], { mustNot: [/không (?:nặng|nghiêm trọng)/i] }],
  ['r3-9', ['tôi bị ho 3 tuần', 'có phải ung thư không'], { mustNot: [/không phải (?:là )?ung thư/i] }],
  ['r3-10', ['tôi bị đau họng', 'sang da liễu có sao không'], { must: [TMH] }],
  ['r3-11', ['tôi bị đau đầu gối', 'bác sĩ nội có giỏi về khớp không'], { must: [NOI] }],
  ['r3-12', ['bé nhà tôi 4 tuổi bị đau bụng', 'có khoa tiêu hoá không'], { must: [CHUA_CO, NHI] }],
  ['r3-13', ['tôi bị nổi mề đay', 'có nguy hiểm không'], { must: [DA] }],
  ['r3-14', ['tôi bị đau đầu gối', 'vậy khám nội là đúng hả'], {}],
  ['r3-15', ['tôi bị đau đầu gối', 'sao không có khoa xương khớp'], { must: [CHUA_CO] }],
];

const sameReply = (a, b) => {
  const w = (s) => new Set(s.toLowerCase().match(/[\p{L}\d]+/gu) || []);
  const x = w(a), y = w(b);
  return [...x].filter((t) => y.has(t)).length / Math.max(x.size, y.size, 1) >= 0.8;
};

async function ask(message, history) {
  const res = await fetch(`http://localhost:${PORT}/api/ai/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }), signal: AbortSignal.timeout(180000),
  });
  const d = await res.json().catch(() => ({}));
  return d.reply || d.error || `HTTP ${res.status}`;
}

(async () => {
  let flagged = 0, total = 0;
  for (const [name, msgs, check] of S) {
    if (FILTER && !FILTER.test(name)) continue;
    total++;
    const history = [];
    const flags = [];
    let last = '';
    for (const m of msgs) {
      const r = await ask(m, history);
      if (last && sameReply(r, last)) flags.push('LẶP câu trước');
      if (/xin kiểm tra|sẽ kiểm tra|sẽ báo lại/i.test(r)) flags.push('hứa kiểm tra');
      history.push({ role: 'user', content: m }, { role: 'assistant', content: r });
      last = r;
    }
    for (const re of check.must || []) if (!re.test(last)) flags.push(`thiếu ${re}`);
    for (const re of check.mustNot || []) if (re.test(last)) flags.push(`có ${re}`);
    if (flags.length) flagged++;
    console.log(`${flags.length ? '⚠' : '✓'} ${name}: ${msgs.join(' → ')}`);
    console.log(`    → ${last.replace(/\s+/g, ' ').slice(0, 400)}`);
    if (flags.length) console.log(`    !! ${flags.join('; ')}`);
  }
  console.log(`\n${total - flagged}/${total} không bị gắn cờ`);
})();
