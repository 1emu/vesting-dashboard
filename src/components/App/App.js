import React, { Component } from 'react'
import './App.css'
import PropTypes from 'prop-types'
import Header from '../Header'
import Dashboard from '../Dashboard'
import Footer from '../Footer'
import { isValidAddress } from '../../utils'
import DaoInitiativeContextProvider from '../../context/DaoInitiativeContext'
import LandingPage from '../LandingPage/LandingPage'
import ErrorPage from '../ErrorPage/ErrorPage'
import LoadingPage from '../LoadingPage/LoadingPage'
import WrongNetworkModal from '../WrongNetworkModal/WrongNetworkModal'
import { ChainId } from '@dcl/schemas/dist/dapps/chain-id'

class App extends Component {
  static propTypes = {
    loadingMessage: PropTypes.string,
    errorMessage: PropTypes.string,
    isLoaded: PropTypes.bool,
    onConnect: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      address: this.props.address || localStorage.getItem('address') || null,
      chainId: this.props.chainId || null,
      showNetworkChangeModal: false,
    }
  }

  componentWillMount() {
    const { onConnect } = this.props
    onConnect()
    document.addEventListener('keydown', this.handleKeyDown)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.address !== this.props.address) {
      const { onConnect } = this.props
      onConnect()
    }
  }

  componentDidMount() {
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isConnected()) {
      const expectedChainId = '0x1';

      window.ethereum.request({ method: 'eth_chainId' })
        .then(chainId => {
          if (chainId !== expectedChainId) {
            console.log('WRONG CHAIN ID: ', chainId)
            this.setState({ showNetworkChangeModal: true, chainId: parseInt(String(chainId).substring(2), 16)});
          }
        })
        .catch(error => console.log(error));

      window.ethereum.on('chainChanged', (chainId) => {
        console.log('CHANGED CHAIN ID', chainId)
        if (chainId !== expectedChainId) {
          this.setState({ showNetworkChangeModal: true, chainId: parseInt(String(chainId).substring(2), 16)});
        }
      });

    } else {
      console.log('Please install MetaMask to use this app');
    }
  }

  async switchToMainnet() {
    try {
      window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }],
      }).then(() => {
        window.location.reload()
      })
    } catch (error) {
      console.error(error);
    }
  }


  handleAddressChange = (e) => {
    const address = e.target.value.trim()
    localStorage.setItem('address', address)
    this.setState({ address })
  }

  handleKeyDown = (e) => {
    const isEnterKey = e.which === 13 || e.which === 32
    const { onAccess, showPrompt, address } = this.props
    if (
      isEnterKey &&
      showPrompt &&
      this.state.address &&
      isValidAddress(this.state.address) &&
      this.state.address !== address
    ) {
      onAccess(this.state.address)
    }
  }

  renderPrompt() {
    const { isNotFound, address, network } = this.props
    const landingProps = {
      isNotFound,
      address,
      network,
      handleAddressChange: (e) => this.handleAddressChange(e),
    }
    return (
      <div className="app start">
        <LandingPage stateAddress={this.state.address} {...landingProps} />
      </div>
    )
  }

  renderError() {
    const { connectionError } = this.props

    return (
      <div className="app start">
        <ErrorPage connectionError={connectionError} />
      </div>
    )
  }

  renderLoading() {
    const { loadingMessage } = this.props
    return (
      <div className="app start">
        <LoadingPage msg={loadingMessage} />
      </div>
    )
  }

  renderNetworkChangeModal() {
    console.log('thisStateChainId', this.state.chainId)
    return (
      <div className="app start">
        <WrongNetworkModal
          isOpen={true}
          currentNetwork={this.state.chainId}
          expectedNetwork={ChainId.ETHEREUM_MAINNET}
          onSwitchNetwork={this.switchToMainnet}
        />
      </div>
    )
  }

  render() {
    const {
      loadingMessage,
      connectionError,
      contractError,
      showPrompt,
      isLoaded,
    } = this.props
    if (loadingMessage) {
      return this.renderLoading()
    }
    if(connectionError || !!this.state.showNetworkChangeModal) {
      return this.renderNetworkChangeModal()
    }
    if (contractError) {
      return this.renderError()
    }
    if (showPrompt) {
      return this.renderPrompt()
    }
    if (!isLoaded) {
      return null
    }
    return (
      <div className="app">
        <DaoInitiativeContextProvider>
          <Header />
          <Dashboard />
          <Footer />
        </DaoInitiativeContextProvider>
      </div>
    )
  }
}

export default App
