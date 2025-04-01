const userRouter = require('./user')
const conversationRouter = require('./conversation')
const messageRouter = require('./message')
const initRoutes = (app) => {
    app.use('/api', userRouter)
    app.use('/api', conversationRouter)
    app.use('/api/message', messageRouter)
}

module.exports = initRoutes