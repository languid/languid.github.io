'use strict';

const HeaderTheme = {
  White: 'white',
  Black: 'black'
}

const ItemType = {
  Title: 'title',
  Text: 'text',
  Image: 'image',
  Video: 'video'
}

const DefaultAddFd = {
  type: ItemType.Title,
  content: '',
  src: '',
  legend: ''
}

new Vue({
  name: 'app',
  el: '#app',
  computed: {
    ItemType () {
      return ItemType
    },
    HeaderTheme () {
      return HeaderTheme
    },
    itemOptions () {
      return [{
        value: ItemType.Title,
        label: '标题'
      }, {
        value: ItemType.Text,
        label: '文本'
      }, {
        value: ItemType.Image,
        label: '图片'
      }, {
        value: ItemType.Video,
        label: '视频'
      }]
    }
  },
  data () {
    return {
      fd: {
        bgColor: '#f8d572',
        headerTheme: HeaderTheme.White,
        billboardImg: 'dist/assets/case-billboard.png'
      },
      addFd: {
        ...DefaultAddFd
      },
      paragraphs: []
    }
  },
  methods: {
    add () {
      this.paragraphs.push({
        ...this.addFd
      })
      this.addFd = {
        ...DefaultAddFd,
        type: this.addFd.type
      }
    },
    remove (index) {
      this.paragraphs.splice(index, 1)
    }
  }
})
