import {
  apiVersion,
  ClientToServerEvents,
  ServerToClientEvents,
  Status,
  Maintenance,
} from '..'
import { ReleaseChannel } from '../../utils'
import EventEmitter from 'events'
import express from 'express'
import { createServer } from 'http'
import { Socket, Server as SocketIOServer } from 'socket.io'

export class BlueBerryServer extends EventEmitter {
  private _app = express()
  private _httpServer = createServer(this._app)
  private _ioServer = new SocketIOServer(this._httpServer)
  public sockets = new Map<ReleaseChannel, string>()
  public constructor(private _port: number) {
    super()
    console.log(`[BlueBerryAPI server] version: ${apiVersion}`)

    this._app.use(express.json())

    this._app.get('/', (_, res) => {
      res.json({
        ping: 'Pong!',
      })
    })
  }

  public start() {
    this._httpServer.listen(this._port, () => {
      console.log(`[BlueBerryAPI server] port: ${this._port}`)
      console.log('[BlueBerryAPI server] Server is on.')
    })

    this._ioServer.on(
      'connection',
      (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
        this.emit('connection', socket)

        socket.on('handshake', (client, res) => {
          this.sockets.set(client, socket.id)

          res({
            // dummy
            maintenance: false,
          })
        })

        socket.on('status', (client, res) => {
          const id = this.sockets.get(client)

          if (!id) return

          this._ioServer.to(id).emit('status', (data: Status) => {
            res(data)
          })
        })

        // this._wsServer.on('connection', (ws, request) => {
        //   this.emit('connection', ws, request)

        //   if (process.env.NODE_ENV === 'development') {
        //     console.log('[BlueBerryAPI server] connected.')
        //   }

        //   ws.on('message', (raw, isBinary) => {
        //     this.emit('message', raw, isBinary)

        //     try {
        //       const data: WebSocketRequest<any> = JSON.parse(String(raw))

        //       switch (data.action) {
        //         case Actions.ReqMaintenance:
        //           reqMaintenance(ws, data)
        //         case Actions.ReqFirstConnection:
        //           this._sockets = reqFirstConnection(ws, data, this._sockets)
        //         case Actions.ReqStatus:
        //           reqServerStatus(ws, data, this._sockets)
        //       }
        //     } catch (err) {
        //       console.error(err)
        //       ws.send(
        //         JSON.stringify({
        //           status_code: 400,
        //           error: 'The data is json. But it is not json',
        //         }),
        //       )
        //     }
        //   })

        //   ws.on('close', () => {
        //     if (process.env.NODE_ENV === 'development') {
        //       console.log('[BlueBerryAPI server] closed.')
        //     }
        //   })
      },
    )
  }

  public maintenance(client: ReleaseChannel, data: Maintenance) {
    const id = this.sockets.get(client)
    if (!id) return

    this._ioServer.to(id).emit('maintenance', data)
  }
}
