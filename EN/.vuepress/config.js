module.exports = {
    title: 'Beerus',
    description: 'Web framework developed using Golang',
    themeConfig: {
        nav: [
          { text: 'Home', link: '/' },     
          { text: 'Github', link: 'https://github.com/yuyenews' },
          { text: 'Discussions', link: '/guide/' },
          { text: 'Sponsor', link: 'https://google.com' }, 
          {
            text: 'Document',
            items: [
              { text: 'Beerus', link: '/beerus/index.md' },
              { text: 'Beerus-db', link: '/beerusdb/index.md' }
            ]
          },
          {
            text: 'Languages',
            items: [
              { text: '简体中文', link: '/' },
              { text: 'English', link: '/' }
            ]
          }
        ],
        sidebar: 'auto'
      }
}