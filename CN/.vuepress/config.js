module.exports = {
    title: 'Beerus',
    description: '基于Go开发的Web框架',
    themeConfig: {
        nav: [
          { text: '首页', link: '/' },        
          { text: 'Github', link: 'https://github.com/yuyenews' },              
          { text: '社区', link: '/guide/' },
          { text: '赞助', link: 'https://google.com' }, 
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
              { text: '简体中文', link: '/' },
              { text: 'English', link: '/' }
            ]
          }
        ],
        sidebar: 'auto'
      }
}