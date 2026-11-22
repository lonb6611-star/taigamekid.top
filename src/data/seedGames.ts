import { GameItem } from '../types/game';

export const HERO_BANNER_IMAGE = '/src/assets/images/hero_gaming_setup_1795322029835.jpg';

export const SAMPLE_COVER_OPTIONS = [
  {
    label: 'Hành động Cyber',
    url: '/src/assets/images/cover_cyber_action_1795322030078.jpg',
  },
  {
    label: 'Sinh tồn Bắc Cực',
    url: '/src/assets/images/cover_frost_survival_1795322030299.jpg',
  },
  {
    label: 'Nhập vai Giả tưởng',
    url: '/src/assets/images/cover_astral_rpg_1795322029827.jpg',
  },
  {
    label: 'Thể thao Bóng đá',
    url: '/src/assets/images/cover_apex_sports_1795322030003.jpg',
  },
  {
    label: 'Phiêu lưu Hang động',
    url: '/src/assets/images/cover_hollow_adventure_1795322029805.jpg',
  },
];

export const INITIAL_SEED_GAMES: GameItem[] = [
  {
    id: 'game-cyber-drift-neo',
    title: 'Cyber Drift: Neo Saigon',
    coverUrl: '/src/assets/images/cover_cyber_action_1795322030078.jpg',
    category: 'hack',
    genre: 'Hành động',
    version: 'v2.4.1',
    size: '28.4 GB',
    downloadUrl: 'https://cdn.taigamekid.vn/files/cyber-drift-neo-saigon-v2.4.1.zip',
    review:
      'Cyber Drift: Neo Saigon đưa người chơi vào vai một đặc vụ giao vận đêm trong thành phố tương lai rực ánh đèn neon và những cơn mưa tầm tã. Phiên bản mở khóa sẵn toàn bộ trang bị và tùy biến xe giúp trải nghiệm tự do ngay từ đầu.\n\nĐồ họa được tối ưu tốt cho cả cấu hình tầm trung, hiệu ứng phản chiếu mặt đường ướt mang lại chiều sâu thị giác ấn tượng mà vẫn giữ vững khung hình ổn định trên 60 FPS.',
    installGuide: [
      'Tải về toàn bộ tệp nén Cyber_Drift_Neo_Saigon_v2.4.1.zip bằng nút Tải Miễn Phí bên trên.',
      'Giải nén tệp vừa tải bằng WinRAR hoặc 7-Zip vào thư mục có đường dẫn không chứa dấu tiếng Việt (ví dụ: D:\\Games\\CyberDrift).',
      'Mở thư mục _CommonRedist bên trong và cài đặt đầy đủ DirectX cùng Visual C++ Runtime nếu máy chưa có.',
      'Nhấp chuột phải vào tệp CyberDrift.exe và chọn "Run as Administrator" để khởi chạy game với hiệu năng cao nhất.',
    ],
    updatedAt: '2026-11-20T10:00:00.000Z',
    downloadsCount: 1420,
  },
  {
    id: 'game-astral-chronicle',
    title: 'Astral Chronicle: Eclipse',
    coverUrl: '/src/assets/images/cover_astral_rpg_1795322029827.jpg',
    category: 'hack',
    genre: 'Nhập vai',
    version: 'v3.1.2',
    size: '42.5 GB',
    downloadUrl: 'https://cdn.taigamekid.vn/files/astral-chronicle-eclipse-v3.1.2.zip',
    review:
      'Astral Chronicle: Eclipse là tựa game nhập vai hành động thế giới mở lấy bối cảnh vương quốc cổ đại bị chia cắt bởi những khối đá hắc thạch lơ lửng mang cổ ngữ ánh tím. Phiên bản hỗ trợ menu tinh chỉnh tài nguyên và mở khóa kỹ năng nhanh.\n\nMỗi khu vực tàn tích đều ẩn chứa boss bí mật với bộ chiêu thức đa dạng, bản cập nhật v3.1.2 đã bổ sung thêm chương mở rộng Nguyệt Thực và tối ưu đáng kể thời gian tải màn chơi.',
    installGuide: [
      'Tải bộ cài đặt Astral_Chronicle_Eclipse_v3.1.2.zip về máy tính.',
      'Giải nén bằng 7-Zip phiên bản mới nhất để tránh lỗi tràn đường dẫn file tài nguyên.',
      'Chạy file setup.exe, chọn ổ đĩa SSD để đạt tốc độ nạp cảnh mượt mà nhất và nhấn Install.',
      'Sau khi hoàn tất, mở game từ biểu tượng Astral Chronicle ngoài màn hình Desktop.',
    ],
    updatedAt: '2026-11-18T08:15:00.000Z',
    downloadsCount: 2150,
  },
  {
    id: 'game-frostborne-outpost',
    title: 'Frostborne: Last Outpost',
    coverUrl: '/src/assets/images/cover_frost_survival_1795322030299.jpg',
    category: 'normal',
    genre: 'Sinh tồn',
    version: 'v1.8.0',
    size: '16.2 GB',
    downloadUrl: 'https://cdn.taigamekid.vn/files/frostborne-last-outpost-v1.8.0.zip',
    review:
      'Frostborne: Last Outpost tái hiện chân thực cuộc chiến sinh tồn khắc nghiệt giữa vùng cực băng giá dưới bầu trời cực quang huyền ảo. Bạn phải thu thập củi đốt, săn bắn, chế tạo trang bị giữ ấm và gia cố căn cứ gỗ trước những cơn bão tuyết kéo dài nhiều ngày.\n\nCơ chế thời tiết động tác động trực tiếp đến thân nhiệt, độ bền công cụ và tầm nhìn của nhân vật. Không chạy theo lối chơi bắn súng ồn ào, game chinh phục người chơi bằng nhịp độ căng thẳng, âm thanh gió rít chân thực và cảm giác thỏa mãn khi thắp sáng ngọn đèn bão giữa đêm đông.',
    installGuide: [
      'Tải tệp cài đặt Frostborne_Last_Outpost_v1.8.0.zip về ổ cứng còn trống tối thiểu 25 GB.',
      'Nhấp chuột phải vào tệp nén và chọn Extract Here để giải nén toàn bộ dữ liệu game.',
      'Kiểm tra xem trình diệt virus có nhận nhầm tệp lưu tiến trình không, nếu cần hãy thêm thư mục game vào danh sách loại trừ.',
      'Chạy tệp FrostborneLauncher.exe, chọn ngôn ngữ Tiếng Việt trong mục Settings và bắt đầu hành trình sinh tồn.',
    ],
    updatedAt: '2026-11-19T14:30:00.000Z',
    downloadsCount: 985,
  },
  {
    id: 'game-apex-strikers-26',
    title: 'Apex Strikers 26',
    coverUrl: '/src/assets/images/cover_apex_sports_1795322030003.jpg',
    category: 'normal',
    genre: 'Thể thao',
    version: 'v26.2.0',
    size: '34.0 GB',
    downloadUrl: 'https://cdn.taigamekid.vn/files/apex-strikers-26-v26.2.0.zip',
    review:
      'Apex Strikers 26 nâng tầm trải nghiệm bóng đá hiện đại với công nghệ mô phỏng vật lý trái bóng thế hệ mới và chuyển động cầu thủ cực kỳ tự nhiên dưới ánh đèn sân vận động ban đêm. Chế độ Career Mode cho phép bạn quản lý chiến thuật, đào tạo cầu thủ trẻ và chinh phục các giải đấu đỉnh cao.\n\nĐiểm cộng lớn của phiên bản này là hỗ trợ tay cầm Xbox/PlayStation cắm là nhận ngay, độ trễ phím gần như bằng không và góc quay camera truyền hình sống động như đang theo dõi một trận chung kết thực thụ.',
    installGuide: [
      'Tải xuống gói cài đặt Apex_Strikers_26_Full.zip từ liên kết trực tiếp.',
      'Giải nén toàn bộ thư mục vào ổ D hoặc ổ C (đảm bảo trống ít nhất 40 GB).',
      'Cắm tay cầm (nếu dùng) trước khi mở game để hệ thống tự động nhận cấu hình phím.',
      'Nhấn đúp vào ApexStrikers26.exe để vào thẳng sân cỏ và tùy chỉnh độ phân giải phù hợp màn hình.',
    ],
    updatedAt: '2026-11-17T16:45:00.000Z',
    downloadsCount: 1760,
  },
  {
    id: 'game-hollow-vale',
    title: 'Shadow of Hollow Vale',
    coverUrl: '/src/assets/images/cover_hollow_adventure_1795322029805.jpg',
    category: 'normal',
    genre: 'Phiêu lưu',
    version: 'v1.4.5',
    size: '4.6 GB',
    downloadUrl: 'https://cdn.taigamekid.vn/files/shadow-of-hollow-vale-v1.4.5.zip',
    review:
      'Shadow of Hollow Vale là viên ngọc indie đậm chất nghệ thuật kể về hành trình khám phá thung lũng hang động ngầm phát sáng huyền bí. Trò chơi khéo léo đan xen giữa giải đố môi trường thông minh và những pha di chuyển vượt địa hình đầy thử thách.\n\nDù dung lượng rất nhẹ và chạy mượt trên hầu hết laptop văn phòng, phần hình ảnh vẽ tay tỉ mỉ cùng nhạc nền piano sâu lắng tạo nên sức hút khó rời mắt ngay từ những phút đầu tiên.',
    installGuide: [
      'Tải tệp nén gọn nhẹ Shadow_of_Hollow_Vale_v1.4.5.zip (4.6 GB).',
      'Giải nén tệp vào một thư mục bất kỳ trên máy tính.',
      'Không cần cài đặt phức tạp, chỉ cần mở file HollowVale.exe là có thể chơi ngay lập tức.',
    ],
    updatedAt: '2026-11-16T09:20:00.000Z',
    downloadsCount: 840,
  },
];
