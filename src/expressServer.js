const {app} = require('./server');
const routes = require('./routes/index');
const matchRoute = require('./routes/matchRoute')
const userRoute = require('./routes/userRoute');
const Errorhandling = require('./middleware/errorhandling');

app.get('/api/v1', (req, res)=>res.status(200).send( 'Server is running...'));
app.use("/api/v1/match", matchRoute)
app.use('/api/v1/homepage',routes.homepageRoutes);
app.use('/api/v1/user',userRoute);
app.use('/api/v1/trigger', require('./routes/trigger'));
app.use(Errorhandling)
