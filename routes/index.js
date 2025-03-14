const userRouter = require('./user')

const initRoutes = (app) => {
    app.use('/api', userRouter)
}

module.exports = initRoutes