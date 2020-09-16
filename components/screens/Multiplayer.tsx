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
  const [committed, setCommitted] = useState(true)

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
  }, [props.user])


  /* 
    Get a manicured list of collections
    Sorted by newest-first, limit of 100
    Only games that are in matchmaking or in progress
  */
  useEffect(() => {
    firestore()
      .collection('matches')
      .where('status', 'in', ['matchmaking', 'in-progress'])
      .orderBy('created_at', 'desc')
      .limit(100)
      .onSnapshot(querySnapshot => {
        const matchCollection: Match[] = [];
        querySnapshot?.forEach((documentSnapshot: any) => {
          // console.log(documentSnapshot)
          const data: Match = documentSnapshot.data()
          matchCollection.push({
            ...data,
            id: documentSnapshot.id
          });
        });

        // band-aid for a bug...
        if (!matchCollection.length) { return }

        setMatches(matchCollection)
      })
  }, [])

  /* Check matches to see if user is a host or player already */
  useEffect(() => {
    const playing = matches?.find(m => {
      return m.players?.find(p => {
        return p.id === user?.id
      })
    })

    const hosting = matches?.find(m => m.host.uid === user?.id)

    if (playing || hosting) {
      setCommitted(true)
    } else {
      setCommitted(false)
    }
  }, [matches])

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
              <Text>Players: {item.players.length}/4</Text>
              <Text>Hosted by: {item.host?.username}</Text>
              
              { /* I can join the match if: */
                item.host.uid !== user?.id && /* I'm not the host */
                item.players.length < 4 && /* There is an empty space in [players] */
                (item.players && !item.players.find(p => p.id === user?.id)) && /* I haven't already joined this match */
                !committed && /* I haven't joined ANY active match */
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
