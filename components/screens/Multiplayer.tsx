import React, { useState, useEffect } from 'react'

import { StyleSheet, Text, View, Button, FlatList } from 'react-native'

import firestore from '@react-native-firebase/firestore'

interface User {
  uid?: string,
  email?: string,
  name?: string,
}

interface Match {
  id: string,
  host: string,
  name?: string,
  players: string,
  created_at: string,
  started_at?: string,
  ended_at?: string,
  winner?: string,
  status: string 
}

export default function Multiplayer(props: any) {
  const [user, setUser] = useState<User | null>(null)
  const [matches, setMatches] = useState([])

  useEffect(() => {

    // get the full current user document
    firestore()
      .collection('users')
      .where('user', '==', props.user.uid)
      .get()
      .then(querySnapshot => {
        if (!querySnapshot) {
          return console.error('users query failed')
        }
        const data = querySnapshot.docs[0].data()
        const withId = {
          ...data,
          id: querySnapshot.docs[0].id
        }
        return setUser(withId)
      })

    // get a collection of all matches
    // sort by newest first (created_at)
    // filter out matches with status: in progress, abandoned, complete
    firestore()
      .collection('matches')
      .onSnapshot(querySnapshot => {
        const matchCollection:Match[] = [];

        querySnapshot.forEach((documentSnapshot:any) => {
          const data:Match = documentSnapshot.data()
          matchCollection.push({
            ...data,
            id: documentSnapshot.id
          });
        });
        setMatches(matchCollection)
      })

  }, [props.user])

  const createNewLobby = () => {
    firestore()
      .collection('matches')
      .add({
        host: { uid: user?.id, username: user?.name },
        name: '',
        players: [],
        created_at: firestore.FieldValue.serverTimestamp(),
        started_at: null,
        ended_at: null,
        winner: null,
        status: 'matchmaking' 
      })
      .then((result) => {
        props.navigation.navigate('Matchmaking', {
          matchId: result.id
        })
      });
  }

  const joinMatch = (match: any) => {
    // add the user to the match.players array
    firestore()
      .collection('matches')
      .doc(match.id)
      .update({
        players: [...match.players, user]
      })
      .then(() => {
        console.log('Match updated!');
        props.navigation.navigate('Matchmaking', {
          matchId: match.id
        })
      });  
  }

  return (
    <View style={styles.container}>
      <Button title="Host a Match" onPress={() => createNewLobby()}/>

      <Text>Matches</Text>
      <FlatList
        data={matches}
        keyExtractor={(m) => m.id}
        renderItem={({item}) => {
          return (
            <View style={styles.match}>
              <Text>Status: {item.status}</Text>
              <Text>Players: {item.players?.length}/4</Text>
              <Text>Hosted by: {item.host?.username}</Text>
              
              { /* I can join the match if: */
                item.host.uid !== user?.id && /* I'm not the host */
                item.players?.length < 4 && /* There is an empty space in [players] */
                (item.players && !item.players.find(p => p.id === user?.id)) && /* I haven't already joined */
                (
                  <Button title="Join" onPress={() => joinMatch(item)} />
                )
              }

              { /* I can enter the Match Lobby directly if */
                item.host.uid === user?.id || /* if I'm the host */
                (item.players && item.players.find(p => p.id === user?.id)) ? /* I've already joined */
                (
                  <Button 
                    title="Enter" 
                    onPress={() => props.navigation.navigate('Matchmaking', { 
                      matchId: item.id
                    })} 
                  />
                ) : null
              }
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  match: {
    borderColor: '#000',
    borderWidth: 1,
    marginVertical: 2
  }
})
