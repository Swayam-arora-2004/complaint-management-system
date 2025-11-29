# Common Server Commands

## Start Development Server
```bash
npm run dev
```
Starts the server with auto-reload (nodemon)

## Start Production Server
```bash
npm start
```
Starts the server without auto-reload

## Check if Server is Running
```bash
curl http://localhost:5001/api/health
```

## Stop Server
Press `Ctrl+C` in the terminal where the server is running

## Check Server Logs
```bash
tail -f /tmp/server.log
```

## Common npm Commands
- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm test` - Run tests (if configured)

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5001
lsof -i :5001

# Kill the process
kill -9 <PID>
```

### Server Won't Start
1. Check MongoDB is running: `mongosh`
2. Check `.env` file exists
3. Check dependencies: `npm install`

