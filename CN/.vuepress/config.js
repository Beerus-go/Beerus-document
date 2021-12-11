module.exports = {
    title: 'Beerus',
    description: '用Go语言开发的Web解决方案',
    base: '/cn/',
    themeConfig: {
        nav: [
          { text: '首页', link: '/' },        
          { text: 'Github', link: 'https://github.com/yuyenews' },              
          { text: '社区', link: 'https://github.com/yuyenews/Beerus/discussions' },
          { text: 'Telegram', link: 'https://t.me/beeruscc'},
          { text: '赞助', link: '/sponsor/sponsor.md' }, 
          {
            text: '文档',
            items: [
              { text: 'Beerus', link: '/beerus/index.md' },
              { text: 'Beerus-db', link: '/beerusdb/index.md' }
            ]
          },
          {
            text: 'Languages',
            items: [
              { text: '简体中文', link: 'https://beeruscc.com/cn' },
              { text: 'English', link: 'https://beeruscc.com' }
            ]
          }
        ],
        sidebar: 'auto'
      }
}