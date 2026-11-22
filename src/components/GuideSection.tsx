export function GuideSection() {
  const steps = [
    {
      num: '01.',
      title: 'Tìm kiếm & Xem đánh giá',
      desc: 'Sử dụng thanh tìm kiếm hoặc bộ lọc thể loại để chọn trò chơi phù hợp cấu hình máy tính của bạn. Đọc kỹ bài đánh giá và dung lượng yêu cầu.',
    },
    {
      num: '02.',
      title: 'Đăng nhập tài khoản thành viên',
      desc: 'Đăng ký tài khoản miễn phí chỉ trong vài giây hoặc đăng nhập để mở khóa liên kết tải trực tiếp tốc độ cao cho toàn bộ kho game.',
    },
    {
      num: '03.',
      title: 'Tải về & Cài đặt từng bước',
      desc: 'Nhấn nút Tải Miễn Phí trong trang chi tiết và làm theo đúng hướng dẫn cài đặt từng bước được đính kèm bên dưới mỗi tựa game.',
    },
  ];

  return (
    <section
      id="guide-section"
      className="border-t border-white/10 bg-[#090B12] py-14 lg:py-16"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Quy trình tải & cài đặt chuẩn
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Ba bước đơn giản giúp bạn tải game an toàn, hạn chế lỗi thiếu file và sẵn sàng trải
            nghiệm ngay.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.num}
              className="rounded-2xl border border-white/10 bg-[#0D1019] p-6 transition-colors hover:border-purple-400/35"
            >
              <span className="font-mono text-sm font-semibold text-cyan-300">{step.num}</span>
              <h3 className="mt-2.5 font-display text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
