import React, { Component } from 'react';
import MessageList from './components/MessageList';
import './App.css';
import './style.css';
import ChatkitClient from '@pusher/chatkit-client'
import { instanceLocator, tokenUrl } from './config'
import SendMessageForm from './components/SendMessageForm';
import RoomList from './components/RoomList';
import NewRoomForm from './components/NewRoomForm';

class App extends Component {

  constructor() {
    super()
    this.state = {
      roomId: null,
      messages: [],
      joinableRooms: [],
      joinedRooms: []
    }
    this.sendMessage = this.sendMessage.bind(this);
    this.subscribeToRoom = this.subscribeToRoom.bind(this);
    this.getRooms = this.getRooms.bind(this);
    this.createRoom = this.createRoom.bind(this);
  }

  componentDidMount() {
    const chatManager = new ChatkitClient.ChatManager({
        instanceLocator,
        userId: 'pete',
        tokenProvider: new ChatkitClient.TokenProvider({
          url: tokenUrl
        })
    })
    chatManager.connect()
    .then(currentUser => {
            this.currentUser = currentUser
            this.getRooms()
          })
          .catch(err => console.error("error on connecting: ", err))
  }

  getRooms() {
    this.currentUser.getJoinableRooms()
            .then(joinableRooms => {
              this.setState({
                joinableRooms,
                joinedRooms: this.currentUser.rooms
              })
            })
            .catch(err => console.log('error on joinableRooms: ', err))
  }

  subscribeToRoom(roomId) {
    this.setState({ messages: [] })
    this.currentUser.subscribeToRoom({
      roomId: roomId,
      hooks: {
        onMessage: message => {
          console.log(`Received new message: ${message.text}`)
          this.setState({
            messages: [...this.state.messages, message]
          })
        }
      }
    })
    .then(room => {
      this.setState({
        roomId: room.id
      })
      this.getRooms()
    })
    .catch(err => console.log('error on subscribing to room: ', err))
  }

  sendMessage(text) {
    this.currentUser.sendMessage({
      text,
      roomId: this.state.roomId
    })
  }

  createRoom(name) {
    this.currentUser.createRoom({
      name
    })
    .then(room => this.subscribeToRoom(room.id))
    .catch(err => console.log('error creating room: ', err))
  }

  render() {
    console.log(this.state.messages)
    return (
      <div className="app">
        <RoomList 
            roomId={this.state.roomId}
            subscribeToRoom={this.subscribeToRoom}
            rooms={[...this.state.joinableRooms, ...this.state.joinedRooms]} />
        <MessageList 
            roomId={this.state.roomId}
            messages={this.state.messages} />
        <SendMessageForm 
            disabled={!this.state.roomId}
            sendMessage={this.sendMessage} />
        <NewRoomForm createRoom={this.createRoom} />
      </div>
    );
  }
}

export default App;
