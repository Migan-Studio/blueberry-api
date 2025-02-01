import { ReleaseChannel } from '../../utils'
import { container } from '@sapphire/pieces'
import express from 'express'

export class User {
  private _user_id: string
  private _money: string
  private _blocked: boolean
  private _created_at: Date
  private _block_reason: string
  private _release_channel: string

  public get userId() {
    return this._user_id
  }

  public set money(amount) {
    this._money = String(amount)
  }

  public get money() {
    return BigInt(this._money)
  }

  public set blocked(blocked) {
    this._blocked = blocked
  }

  public get blocked() {
    return this._blocked
  }

  public get createdAt() {
    return this._created_at
  }

  public set blockReason(reason) {
    this._block_reason = reason
  }

  public get blockReason() {
    return this._block_reason
  }

  public set releaseChannel(channel) {
    this._release_channel = channel
  }

  public get releaseChannel() {
    return this._release_channel as ReleaseChannel
  }

  public constructor(data: {
    user_id: string
    money: bigint
    blocked: boolean
    created_at: Date
    block_reason: string
    release_channel: string
  }) {
    this._user_id = data.user_id
    this._money = String(data.money)
    this._blocked = data.blocked
    this._created_at = data.created_at
    this._block_reason = data.block_reason
    this._release_channel = data.release_channel as ReleaseChannel
  }

  public toJSONByMoneyToBigInt() {
    return {
      user_id: this._user_id,
      money: BigInt(this._money),
      blocked: this._blocked,
      created_at: this._created_at,
      block_reason: this._block_reason,
      release_channel: this._release_channel,
    }
  }

  public toJSON() {
    return {
      user_id: this._user_id,
      money: this._money,
      blocked: this._blocked,
      created_at: this._created_at,
      block_reason: this._block_reason,
      release_channel: this._release_channel,
    }
  }
}

const router = express.Router()

router.post('/', async (req, res) => {
  const { user_id } = req.body
  try {
    await container.database.user.create({
      data: {
        user_id,
      },
    })

    res.sendStatus(201)
  } catch (err) {
    console.log(err)
    res.status(500).json({
      status: 500,
      err: (err as unknown as Error).message,
    })
  }
})

router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId
    const rawData = await container.database.user.findFirst({
      where: {
        user_id: userId,
      },
    })

    if (!rawData) {
      res.status(404).json({
        status: 404,
        err: `${userId} is not found.`,
      })
    } else {
      const data = new User(rawData)
      res.json(data.toJSON())
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({
      status: 500,
      err: (err as unknown as Error).message,
    })
  }
})

router.patch('/:userId', async (req, res) => {
  const userId = req.params.userId
  const data = new User(req.body)

  try {
    await container.database.user.update({
      where: {
        user_id: userId,
      },
      data: data.toJSONByMoneyToBigInt(),
    })

    res.sendStatus(200)
  } catch (err) {
    console.log(err)
    res.status(500).json({
      status: 500,
      err: (err as unknown as Error).message,
    })
  }
})

router.delete('/:userId', async (req, res) => {
  const userId = req.params.userId

  try {
    await container.database.user.delete({
      where: {
        user_id: userId,
      },
    })

    res.sendStatus(200)
  } catch (err) {
    console.log(err)
    res.status(500).json({
      status: 500,
      err: (err as unknown as Error).message,
    })
  }
})

export { router as userRouter }
