export interface GuideSlide {
  title: string
  body: string
  step?: string
  /**
   * Path to a video file inside `public/`. Use a leading slash: `/assets/video/...`
   * When set, the slide auto-advances when the video ends (ignores the 5-second timer).
   */
  video?: string
  /**
   * Path to an image file inside `public/`. Use a leading slash: `/assets/img/...`
   * The image fills the slide background; the slide still uses the 5-second timer.
   */
  image?: string
}

export interface Guide {
  id: string
  icon: string
  title: string
  subtitle: string
  slides: GuideSlide[]
}

export const GUIDES: Guide[] = [
  {
    id: 'vpn-not-working',
    icon: '🔧',
    title: 'Если VPN не работает',
    subtitle: '5 шагов чтобы всё заработало',
    slides: [
      {
        step: 'Шаг 1 из 5',
        title: 'Перезапустите приложение',
        body: 'Выключите VPN в приложении и включите снова. Затем полностью закройте приложение (смахните из памяти) и откройте заново.',
        video: '/assets/video/guides/vpn_troubles/reboot.MP4',
      },
      {
        step: 'Шаг 2 из 5',
        title: 'Обновите конфиг',
        body: 'Нажмите «Получить конфиг» здесь в мини-приложении или откройте бота и запросите конфиг повторно.',
        video: '/assets/video/guides/vpn_troubles/get_config.mp4',
      },
      {
        step: 'Шаг 3 из 5',
        title: 'Смените сеть',
        body: 'Переключитесь с Wi-Fi на мобильный интернет - или наоборот. Проверьте, открываются ли нужные сайты после смены.',
        image: '/assets/video/guides/vpn_troubles/change_cellular.webp',
      },
      {
        step: 'Шаг 4 из 5',
        title: 'Нажмите «Обновить» в подписке',
        body: 'В приложениях Happ, V2Box, V2Ray Tun, Streisand - зайдите в раздел «Подписки» и нажмите «Обновить» рядом с вашей подпиской.',
        video: '/assets/video/guides/vpn_troubles/refresh.mp4',
      },
      {
        step: 'Шаг 5 из 5',
        title: 'Смените сервер',
        body: 'В приложении VPN выберите другой сервер или локацию. Один сервер может быть перегружен - другой, скорее всего, работает.',
        video: '/assets/video/guides/vpn_troubles/change_server.MP4',
      },
    ],
  },
  {
    id: 'connect-subscription',
    icon: '📲',
    title: 'Как подключить VPN',
    subtitle: 'Пошагово: от конфига до подключения',
    slides: [
      {
        step: 'Шаг 1 из 5',
        title: 'Рекомендуем Happ Plus',
        body: 'Мы советуем приложение Happ Plus - оно простое и работает без лишних настроек. Скачайте его в App Store (iPhone) или Google Play (Android).',
        image: '/assets/guides/connect/1.jpg',
      },
      {
        step: 'Шаг 2 из 5',
        title: 'Получите ссылку на конфиг',
        body: 'Нажмите кнопку «Получить конфиг» прямо здесь, в мини-приложении. Скопируйте ссылку - она понадобится на следующем шаге.',
        image: '/assets/guides/connect/2.webp',
      },
      {
        step: 'Шаг 3 из 5',
        title: 'Добавьте конфиг в Happ',
        body: 'Откройте Happ. Нажмите «+» или «Добавить подписку». Вставьте скопированную ссылку. Happ загрузит все серверы автоматически.',
        image: '/assets/guides/connect/3.jpg',
      },
      {
        step: 'Шаг 4 из 5',
        title: 'Включите VPN',
        body: 'Нажмите большую кнопку подключения в Happ. Система спросит разрешение - нажмите «Разрешить». VPN включён!',
        image: '/assets/guides/connect/4.jpg',
      },
      {
        step: 'Шаг 5 из 5',
        title: 'Используете другое приложение?',
        body: 'V2Box, Streisand, V2Ray Tun - в каждом из них есть раздел «Подписки». Найдите его, нажмите «+» и вставьте ту же ссылку из шага 2.',
        image: '/assets/guides/connect/5.jpg',
      },
    ],
  },
  {
    id: 'referral',
    icon: '🎁',
    title: 'Делись - получай дни',
    subtitle: 'Бонус за приглашения',
    slides: [
      {
        step: 'Шаг 1 из 5',
        title: 'Поделись с близкими',
        body: 'Ваш VPN работает хорошо? Поделитесь им с мамой, папой, детьми или друзьями. За приглашения, после которых друг оплатил первую подписку, начисляются бонусные дни - сколько сейчас, смотрите на экране «Рефералы».',
        image: '/assets/guides/referral/1.webp',
      },
      {
        step: 'Шаг 2 из 5',
        title: 'Найдите вашу ссылку',
        body: 'В нижнем меню мини-приложения есть пункт "Рефералы" - там находится ваш личный реферальный код и кнопка «Поделиться».',
        image: '/assets/guides/referral/2.webp',
      },
      {
        step: 'Шаг 3 из 5',
        title: 'Отправьте ссылку',
        body: 'Нажмите «Поделиться» - откроется Telegram. Вы можете отправить ссылку в любой чат: другу, в семейную группу, кому угодно.',
        image: '/assets/guides/referral/3.webp',
      },
      {
        step: 'Шаг 4 из 5',
        title: 'Что получат они',
        body: 'Ваш близкий перейдёт по ссылке, запустит бота и сможет сразу оформить подписку. Всё просто - никаких кодов вводить не нужно.',
        image: '/assets/guides/referral/4.webp',
      },
      {
        step: 'Шаг 5 из 5',
        title: 'Когда приходит бонус',
        body: 'После первой оплаты приглашённого дни продлеваются автоматически. Точные цифры всегда на экране «Рефералы». Количество приглашений не ограничено.',
        image: '/assets/guides/referral/5.webp',
      },
    ],
  }, 
]
