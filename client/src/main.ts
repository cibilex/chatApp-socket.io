import { createApp } from 'vue'
import App from './App.vue'
import { Quasar, Dialog, Loading, Notify } from 'quasar'
import { createPinia } from 'pinia'


// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'

// A few examples for animations from Animate.css:
// import @quasar/extras/animate/fadeIn.css
// import @quasar/extras/animate/fadeOut.css

// Import Quasar css
import 'quasar/src/css/index.sass'
const pinia = createPinia()


const myApp = createApp(App)

myApp.use(Quasar, {
    plugins: { Dialog, Loading, Notify }
}).use(pinia)

// Assumes you have a <div id="app"></div> in your index.html
myApp.mount('#app')

