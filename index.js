import fs from 'fs'
import solc from 'solc'
import json from 'jsonfile'
import Web3 from 'web3'

export default class Eths6 {
  constructor(params) {
    this.listeners = []
    this.crons = []
    this.cwd = params.cwd
    this.contractParams = params.contractParams
    this.db = params.db
    this.state = {}
    this.setup(params)
  }

  async setup(params) {
    if (!params.file) throw new Error('must specify ./path/to/Contract.sol')
    this.file = params.file
    if (!params.web3Provider) params.web3Provider = 'http://localhost:8545'
    this.web3 = new Web3(params.web3Provider)
    this.owner = await this.getAccount()
    await this.compile()
    await this.deploy()
    await this.subscribeEvents()
  }

  /*
    COMPILE LIBRARY
  */

  async compile() {
    try {
      const compiled = await this.checkCompiled()
      if(!compiled) await this.compileContract()
    } catch (err) {
      throw new Error('### Error compile contracts', err)
    }
  }

  async checkCompiled() {
    return new Promise((res, rej) => {
      fs.stat(`${process.cwd()}/${this.file}.compiled.json`, (err, stat) => {
        if (err) res(false)
        console.log('### compiled exists')
        res(true)
      })
    })
  }

  async compileContract() {
    try {
      const data = await this.getContractData()
      const compiled = await this.solcCompile(data)
      await this.writeCompiled(compiled)
    } catch (err) {
      throw new Error('### Error compiling contract', err)
    }
  }

  async getContractData() {
    return new Promise((res, rej) => {
      fs.readFile(`${this.cwd}/${this.file}.sol`, (err, data) => {
        if(err) rej(err)
        res(data.toString('utf8'))
      })
    })
  }

  async solcCompile(data) {
    return new Promise((res, rej) => {
      const compiledData = solc.compile(data, 1)
      if (compiledData.errors) rej(compiledData)
      res(compiledData)
    })
  }

  async writeCompiled(compiled) {
    return new Promise((res, rej) => {
      json.writeFile(`${this.cwd}/${this.file}.compiled.json`, compiled, (err) => {
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
      const compiled = await this.getCompiled()
      this.bytecode = compiled.contracts[':'+this.file].bytecode
      this.abi = JSON.parse(compiled.contracts[':'+this.file].interface)
      const est = await this.estimateDeploymentGas()
      const gasPrice = await this.averageGasPrice()
      this.contract = new this.web3.eth.Contract(this.abi)
      await this.deployContract(est, gasPrice)
      await this.
    } catch (err) {
      console.log('### Error deploying contract', err)
    }
  }

  async getCompiled() {
    return new Promise((res, rej) => {
      fs.readFile(`${this.cwd}/${this.file}.compiled.json`, (err, data) => {
        if(err) rej(err)
        res(JSON.parse(data.toString('utf8')))
      })
    })
  }

  async deployContract(gasEstimate, gasPrice) {
    return new Promise((res, rej) => {
      console.log('type of this.bytecode', typeof this.bytecode)
      this.contract.deploy({
        data: this.bytecode,
        arguments: this.contractParams,

      }).send({
        from: this.owner,
        gas: gasEstimate + 100000,
        gasPrice: gasPrice
      }).then(inst => {
        res(inst)
      }).catch(err => rej(err))
      res(true)
    })
  }

  /*
    EVENTS
  */

  async subscribeEvents() {
    try {

    } catch (err) {
      throw new Error('### Error subscribing to events', err)
    }
  }

  async eventSubscriptions() {
    return new Promise((res, rej) => {
      console.log('made it here')
      Object.keys(this.contract.events.allEvents).forEach(evt => {
        console.log('evt', evt, typeof evt)
      })
      res(true)
    })
  }

  /*
    State
  */
  async updateState() {
    return new Promise((res, rej) => {

    })
  }

  /*
    WEB3 UTILS
  */

  async getAccount() {
    return new Promise((res, rej) => {
      this.web3.eth.getAccounts()
      .then(accts => {
        res(accts[0])
      }).catch(err => rej(err))
    })
  }

  async estimateDeploymentGas() {
    return new Promise((res, rej) => {
      this.web3.eth.estimateGas({ data: this.bytecode })
      .then(est => {
        res(est)
      }).catch(err => rej(err))
    })
  }

  async averageGasPrice() {
    return new Promise((res, rej) => {
      this.web3.eth.getGasPrice()
      .then(est => {
        console.log('gas price', est)
        res(est)
      }).catch(err => rej(err))
    })
  }
}
