import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { Button, Container, Loader } from 'semantic-ui-react'

import ReactMapboxGl, { Layer, Feature } from 'react-mapbox-gl'

import CurrentSoloMap from '../components/CurrentSoloMap'

import mapBoxAuth from '../config/mapboxAuth'
import * as utils from '../lib/utils.js'
import * as mapHelpers from '../lib/mapContainerHelpers.js'
import '../index.css'

const Map = ReactMapboxGl({ accessToken: mapBoxAuth.pass })
const multiPolygonPaint = { 'fill-color': '#FF0' }

export class SoloContainer extends Component {

  state = {
    coords: [],
    currentSlide: -1,
    lastSlideIndex: null,
    importedCountries: null,
    importedAnswers: null,
    currentLat: null,
    currentLng: null,
    currentZoom: null,
    answersArray: [],
    shuffledAnswersArray: [],
    multiAnswersArray: [],
    mapDisplayOrder: [],
    time: 10,
    showMap: true,
    gameOver: false,
    runningTotal: 0,
    disableButtons: false,
    currentMessage: '',
    successMessage: null,
    redirectToCreate: null
  }

  loadMessages = () => {
    const messages = [  'Time-Compressing Simulator Clock',
                        'Stratifying Ground Layers',
                        'Polishing Water Highlights',
                        'Reticulating Splines',
                        'Graphing Whale Migration',
                        'Building Data Trees',
                        'Splatting Transforms',
                        'Deciding Which Message to Display Next',
                        'Reconfiguring Political Landscape',
                        'Prepping Special Sauce',
                        'Persisting Country Data',
                        'Curbing Enthusiasm',
                        'Playing DOOM on Windows 95',
                        'Searching Worldwide Info-structures',
                        'Un-nesting Loops',
                        'Plotting Revenge Against Humans',
                        'Polling Llama Interface',
                        'Incrementing Happiness Indicators',
                        'Normalizing Frequencies',
                        'Calculating Centroids'
                      ]

    let goofyInterval = setInterval(()=> {
      this.setState({
        currentMessage: messages[utils.getRandomInt(0, messages.length)]
      })
    }, 1448)

    setTimeout(() => {
      clearInterval(goofyInterval)
    }, 10000)

    this.setState({
      currentMessage: messages[utils.getRandomInt(0, messages.length)]
    })
  }

  timeKeeping = seconds => {
    let time = setInterval(() => {
      if (this.state.time <= 0) {
        clearInterval(time)
        if (this.state.lastSlideIndex === this.state.currentSlide) {
          this.setState({ gameOver: true })
        } else {
          this.setState({ time: seconds })
          this.nextSlide()
        }
      } else {
        this.setState({ time: this.state.time - 1 })
      }
    }, seconds * 100)
  }

  componentDidMount() {
    this.loadMessages()
    let useThis = this.props.currentGameTitle || "Learn the countries of Southeast Asia"
    fetch('/retrieve_game_by_id', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify({"game": { "title": useThis } })
    })
      .then(res => res.json())
      .then(response => this.setState({ importedAnswers: response }))
      .then(response => this.formatAnswers(response))
  }

  retrieveCountries = countriesToRequest => {
    fetch('/retrieve_countries', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify(countriesToRequest)
    })
      .then(res => res.json())
      .then(res => {
        let ordered = mapHelpers.orderCountries(this.state.mapDisplayOrder, res)
        this.setState({ importedCountries: ordered })
      })
  }

  createMultipleChoice = (shuffled, firsts) => {
    let multiAnswers = mapHelpers.generateMultiChoice(shuffled, firsts)
    this.setState({ multiAnswersArray: multiAnswers })
  }

  formatAnswers = () => {
    let firsts = this.state.importedAnswers.answers.map(answerArr => {
      return answerArr[0]
    })
    let shuffled = this.state.importedAnswers.answers.map(answerArr => {
      return utils.shuffleArray(answerArr)
    })
    this.createMultipleChoice(shuffled, firsts)
    this.setState({
      mapDisplayOrder: firsts,
      lastSlideIndex: firsts.length - 1,
      shuffledAnswersArray: shuffled
    })
    let formatted = firsts.map(country => {
      return { "name" : country }
    })
    let countriesToRequest = { "query" : formatted }
    this.retrieveCountries(countriesToRequest)
  }

  showSuccess = () => {
    let runningTotal = this.state.runningTotal + 1
    let totalSlides = this.state.currentSlide + 1
    this.setState({
      successMessage: 'Success! ' + runningTotal + " / " + totalSlides
    })
  }

  showFailure = () => {
    let runningTotal = this.state.runningTotal
    let totalSlides = this.state.currentSlide + 1
    this.setState({
      successMessage: 'Whoops! ' + runningTotal + " / " + totalSlides
    })
  }

  recordAnswer = answer => {
    if (!this.state.disableButtons
        && this.state.multiAnswersArray[this.state.currentSlide] === answer) {
      this.setState({ runningTotal: this.state.runningTotal + 1 })
      this.showSuccess()
    } else {
      this.showFailure()
    }
    this.setState({ disableButtons: true })
  }

  nextSlide = () => {
    let newSlide = this.state.currentSlide + 1
    this.setState({
      disableButtons: false,
      currentSlide: newSlide,
      coords: this.state.importedCountries[newSlide].borderData,
      answersArray: this.state.shuffledAnswersArray[newSlide],
      currentLat: this.state.importedCountries[newSlide].latitude,
      currentLng: this.state.importedCountries[newSlide].longitude,
      currentZoom: this.state.importedCountries[newSlide].zoom,
    })
    this.timeKeeping(10)
  }

  redirectToCreate = () => {
    this.setState({ redirectToCreate: true })
  }

  render() {

    if (this.state.redirectToCreate) {
      return <Redirect push to={`/create`}/>
    }

    if ( this.state.gameOver ) {
      return (
        <div className="finalSoloDisplay">
          Game over<br />
          {this.state.runningTotal} / {this.state.lastSlideIndex + 1} correct!
          <Button
            onClick={ ()=>this.redirectToCreate() }
            style={{
              'marginTop' : '44px'
            }}
            size='huge'
            color='teal'
            fluid
          >
            Play again?
          </Button>
        </div>
      )
    }
    if ( this.state.currentSlide >= 0 ) {
      return (
        <CurrentSoloMap
          time={ this.state.time }
          successMessage={ this.state.successMessage }
          answersArray={ this.state.answersArray }
          recordAnswer={ this.recordAnswer }
          disableButtons={ this.state.disableButtons }
          currentLng={ this.state.currentLng }
          currentLat={ this.state.currentLat }
          currentZoom={ this.state.currentZoom }
          coords={ this.state.coords }
        />
      )
    } else {
      if ( this.state.importedCountries ) {
        return (
          <Container
            id="soloLoadingGame"
            text
          >
            <Button
              onClick={ ()=>this.nextSlide() }
              className="startButtonSolo"
              size='massive'
              color='green'
              fluid
            >
              Begin
            </Button>
          </Container>
        )
      } else {
        return (
          <Loader size="huge" active >{ this.state.currentMessage }</Loader>
        )
      }
    }
  }
}

export default SoloContainer
