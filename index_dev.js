import fs from 'fs'
import solc from 'solc'
import Eth from 'ethjs'
import levelup from 'levelup'
import sublevel from 'level-sublevel'

export default class Eths6 {
  constructor(params) {
    if (!params.file) throw new Error('### no file name given')
    if (!params.cwd) throw new Error('### add cwd (directory of reference file)')
    if (!params.deploy) {
      if (!params.address) throw new Error('### must supply address if not deploying contract')
      this.address = params.address
    }
    if (params.params) this.params = params.params
    if (!params.provider) this.provider = 'http://localhost:8545'
    if (params.db) this.db = sublevel(params.db)
    else this.db = sublevel(levelup(`./${this.file}`))
    this.file = params.file
    this.cwd = params.cwd
    this.state = {}  // memory tree that is saved to disk
    if (params.setup) this.setup()
  }

  async setup() {
    try {
      this.eth = new Eth(new Eth.HttpProvider(this.provider))
      await this.compile()
      await this.deploy()
    } catch (err) {
      console.log('### ERROR in setup', err)
    }
  }

  /*
    COMPILE LIBRARY
  */

  async compile() {
    try {
      const compiled = await this.checkCompiled()
      if (!compiled) {
        console.log('### compiled does not exist')
        const data = await this.getContractData()
        const cmpld = await solc.compile(data, 1)
        await this.writeCompiled(cmpld)
      }
    } catch (err) {
      console.log('### ERROR compiling contract', err)
    }
  }

  checkCompiled() {
    return new Promise((res, rej) => {
      fs.stat(`${this.cwd}/${this.file}.compiled.json`, (err, stat) => {
        if (err) res(false)
        res(true)
      })
    })
  }

  getContractData() {
    return new Promise((res, rej) => {
      fs.readFile(`${this.cwd}/${this.file}.sol`, (err, data) => {
        if (err) rej(err)
        res(data.toString('utf8'))
      })
    })
  }

  writeCompiled(compiled) {
    return new Promise((res, rej) => {
      fs.writeFile(`${this.cwd}/${this.file}.compiled.json`, JSON.stringify(compiled), (err) => {
        if (err) rej(err)
        res(true)
      })
    })
  }

  /*
    DEPLOY LIBRARY
  */

  async deploy() {
    try {
      const compiled = await this.checkCompiled()
        if (!compiled) await this.compile()
      const data = await this.getCompiled()
      this.bytecode = data.contracts[':' + this.file].bytecode
      this.abi = JSON.parse(data.contracts[':' + this.file].interface)
      this.contract = this.eth.contract(this.abi, this.bytecode)
      const gasPrice = await this.eth.gasPrice()
      const estimate = await this.eth.estimateGas({data: this.bytecode})
      console.log('estimate', estimate)
      console.log('gasPrice', gasPrice)
      // if (this.deploy) await this.contract.new({data: this.params, from: await this.getCoinbase()})
      // else this.contract = this.eth.conntract(this.abi).at(this.address)
    } catch (err) {
      console.log('### ERROR in deploy', err)
    }
  }

  getCompiled() {
    return new Promise((res, rej) => {
      fs.readFile(`${this.cwd}/${this.file}.compiled.json`, (err, data) => {
        if (err) rej(err)
        res(JSON.parse(data.toString('utf8')))
      })
    })
  }

  /*
    UTILS
  */
  async getCoinbase() {
    try {
      const accounts = await this.eth.accounts()
      return accounts[0]
    } catch (err) {
      console.log('### ERROR in getCoinbase', err)
    }
  }
}
