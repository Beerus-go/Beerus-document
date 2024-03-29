module.exports = {
    title: 'Beerus',
    description: 'A web solution developed in golang',
    themeConfig: {
        nav: [
          { text: 'Home', link: '/' },     
          { text: 'Github', link: 'https://github.com/Beerus-go' },              
          { text: 'Discussions', link: 'https://github.com/Beerus-go/Beerus/discussions' },
          { text: 'Telegram', link: 'https://t.me/beeruscc'},
          { text: 'Sponsor', link: '/sponsor/sponsor.md' }, 
          {
            text: 'Document',
            items: [
              { text: 'Beerus', link: '/beerus/index.md' },
              { text: 'Beerus-db', link: '/beerusdb/index.md' }
            ]
          },
          { text: 'Video', link: 'https://www.bilibili.com/video/BV1JR4y1W7fJ/' }, 
          {
            text: 'Languages',
            items: [
              { text: '简体中文', link: 'https://beeruscc.com/cn' },
              { text: 'English', link: 'https://beeruscc.com' }
            ]
          },
          { text: 'Java', link: 'https://magician-io.com' }
        ],
        sidebar: 'auto'
      }
}