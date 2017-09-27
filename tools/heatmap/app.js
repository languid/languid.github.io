/**
 * Created by Yinxiong on 2017/9/27.
 */

const body = document.body
let scale = 1

Vue.directive('drag', {
  bind (el, bindding, node) {
    let ox = 0
    let oy = 0
    el._bindding = bindding
    el._interact = interact(el).draggable({
      onmove: e => {
        el._bindding.value.ox += e.dx / scale
        el._bindding.value.oy += e.dy / scale
        app.drawHeatmap()
      }
    })
  },
  update (el, bindding) {
    el._bindding = bindding
  },
  unbind (el) {
    el._bindding = null
    el._interact && el._interact.unset()
  }
})

const app = new Vue({
  el: '#app',
  data () {
    this.imgSrc = ''
    this.heatmap = null
    this.imgSize = {
      originWidth: 0,
      originHeight: 0,
      width: 0,
      height: 0,
      left: 0,
      top: 0
    }
    return {
      loaded: false,
      spacing: 15,
      list: [],
      max: 50,
      radius: 80,
      selectedRadius: 0,
      selectedValue: 0,
      controllable: true,
      count: 100,
      opacity: 80,
      selected: {
        value: 0
      },
      size: {
        width: 0,
        height: 0
      }
    }
  },
  watch: {
    radius (v) {
      if (this.heatmap) {
        this.heatmap._store._cfgRadius = v
        this.drawHeatmap()
      }
    },
    max (v) {
      if (this.heatmap) {
        this.heatmap.setDataMax(v)
      }
    },
    selectedRadius (v) {
      if (this.selected) {
        this.selected.radius = +v
        this.drawHeatmap()
      }
    },
    selectedValue (v) {
      if (this.selected) {
        this.selected.value = +v
        this.drawHeatmap()
      }
    }
  },
  computed: {
    editorPosition () {
      if (!this.selected) {
        return {}
      }
      return {
        left: this.selected.x + 'px',
        top: this.selected.y + 'px'
      }
    }
  },
  mounted () {
    this.container = this.$refs.container
    this.canvas = this.$refs.canvas
    this.ctx = this.canvas.getContext('2d')
    let timer = null
    window.addEventListener('resize', () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        this.render()
      }, 0)
    }, false)
    this.render()

    this.$refs.file.addEventListener('change', e => {
      const fr = new FileReader()
      fr.addEventListener('loadend', e => {
        this.imgSrc = e.target.result
        this.render()
        this.loaded = true
      })
      fr.readAsDataURL(e.target.files[0])
      this.$refs.file.value = ''
    }, false)

    const editor = this.$refs.editor
    document.addEventListener('mouseup', e => {
      if (this.selected
        && !('controlHandle' in e.target.dataset)
        && e.target !== editor
        && !editor.contains(e.target)
      ) {
        this.selected = null
      }
    })
  },
  methods: {
    generate () {
      const { left, top, originWidth, originHeight, scale } = this.imgSize
      const arr = new Array(+this.count).fill(0)
      this.list = arr.map(d => {
        const ox = (Math.random() * originWidth) >> 0
        const oy = (Math.random() * originHeight) >> 0
        return {
          ox, oy,
          x: (left + ox * scale) >> 0,
          y: (top + oy * scale) >> 0,
          value: (Math.random() * 100) >> 0,
          radius: 0
        }
      })

      this.render()
    },

    async render () {
      this.clear()
      this.resize()
      await this.drawBackground()
      this.drawHeatmap()
    },
    resize () {
      this.size.width = this.container.clientWidth
      this.size.height = this.container.clientHeight
    },
    clear () {
      this.ctx.clearRect(0, 0, this.size.width, this.size.height)
    },
    clearHeatmap () {
      if (this.heatmap) {
        this.heatmap._renderer._clear()
        this.list = []
      }
    },
    selectFile () {
      this.$refs.file.click()
    },
    drawBackground () {
      return new Promise((resolve, reject) => {
        if (!this.imgSrc) {
          return
        }
        const vm = this
        const size = this.size
        const spacing = this.spacing
        const img = new Image()
        img.addEventListener('load', e => {
          const width = img.width
          const height = img.height
          const w = size.width
          const h = size.height
          const limitWidth = (w - spacing * 2) * .95
          const limitHeight = (h - spacing * 2) * .95
          scale = limitWidth / width
          let finalWidth = width * scale
          let finalHeight = height * scale

          if (finalHeight > limitHeight) {
            scale = limitHeight / height
            finalWidth = width * scale
            finalHeight = height * scale
          }
          this.imgSize = {
            originWidth: width,
            originHeight: height,
            width: finalWidth,
            height: finalHeight,
            left: (w - finalWidth) >> 1,
            top: (h - finalHeight) >> 1,
            scale
          }
          this.ctx.drawImage(img, this.imgSize.left, this.imgSize.top, finalWidth, finalHeight)
          resolve()
        }, false)

        img.src = this.imgSrc
      })
    },
    drawHeatmap () {
      if (!this.list.length) {
        return
      }
      if (!this.heatmap) {
        this.heatmap = h337.create({
          container: this.$refs.heatmap,
          minOpacity: 0,
          maxOpacity: .8,
          radius: this.radius,
          blur: .8
        })
      }

      this.heatmap._renderer.setDimensions(this.size.width, this.size.height)

      const { left, top } = this.imgSize
      this.list.forEach(d => {
        d.x = (left + d.ox * scale) >> 0
        d.y = (top + d.oy * scale) >> 0
      })

      if (this.list.length) {
        this.heatmap.setData({
          max: this.max,
          data: this.list
        })
      }
    },
    remove (item, e) {
      const index = this.list.findIndex(d => d === item)
      this.list.splice(index, 1)
      this.selected = null
      this.drawHeatmap()
    },
    add (e) {
      if (!this.loaded) {
        return
      }
      const { left, top, scale } = this.imgSize
      const x = e.layerX
      const y = e.layerY
      this.list.push({
        x: x,
        y: y,
        ox: ((x - left) / scale) >> 0,
        oy: ((y - top) / scale) >> 0,
        value: (Math.random() * 100) >> 0,
        radius: null
      })
      this.drawHeatmap()
    },
    focus (item) {
      this.selectedValue = item.value
      this.selectedRadius = item.radius || this.radius
      this.selected = item
    },
    download () {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = this.imgSize.width
      canvas.height=  this.imgSize.height
      ctx.drawImage(this.ctx.canvas, -this.imgSize.left, -this.imgSize.top)
      ctx.globalAlpha = this.opacity / 100
      ctx.drawImage(this.heatmap._renderer.canvas, -this.imgSize.left, -this.imgSize.top)
      canvas.toBlob(blob => {
        saveAs(blob, "heatmap.png")
      })
    },
  }
});