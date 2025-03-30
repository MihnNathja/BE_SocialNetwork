const userRouter = require('./user')
const conversationRouter = require('./conversation')
const initRoutes = (app) => {
    app.use('/api', userRouter)
    app.use('/api', conversationRouter)
}

module.exports = initRoutes