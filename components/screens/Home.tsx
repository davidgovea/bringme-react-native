import React, { useState, useEffect } from 'react'

import { Button, Image, TouchableOpacity, StyleSheet, Text, View,} from 'react-native'

import firestore from '@react-native-firebase/firestore'

import { t } from 'react-native-tailwindcss';
import styled from 'styled-components/native';

interface User {
  name: string,
  uid: string,
  email: string
}

export default function Home(props:any) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    firestore()
      .collection('users')
      .where('user', '==', props.user.uid)
      .get()
      .then(querySnapshot => {
        return setUser(querySnapshot.docs[0].data())
      })
  }, [props.user])

  return (
    <View style={styles.container}>
      <View style={[t.mT4, t.pL8, t.pR4, t.wFull]}>
        <Image source={require('../../assets/logo.png')} style={[t.objectContain, t.selfEnd, { width: '80%' }]} />
      </View>
      <View style={[t.flex1, t.wFull]}>
        <Image source={require('../../assets/list.png')} style={[ t.objectContain, t.wFull, { height: 350 } ]} />
        <View style={[t.p4]}>
          <Text style={[t.text3xl]}>
            Hey,<Text style={[t.fontBold, { color: '#FF564F'} ]}> {user?.name || "..."}</Text>
          </Text>
        </View>
      </View>
      <View style={[t.mB8, t.pR8, t.selfStart, t.wFull]}>
        <StyledButton onPress={() => props.navigation.navigate('Multiplayer')}>
          <StyledButtonText>Multiplayer</StyledButtonText>
        </StyledButton>
        <StyledButton onPress={() => props.navigation.navigate('Match')}>
          <StyledButtonText>Single Player</StyledButtonText>
        </StyledButton>
        <StyledButton onPress={() => props.navigation.navigate('Settings')}>
          <StyledButtonText>Settings</StyledButtonText>
        </StyledButton>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
})

const StyledButton = styled(TouchableOpacity)`
  ${[t.justifyCenter, t.h20, t.p4, t.mY2, { backgroundColor: '#FFE8E7', borderTopRightRadius: 20, borderBottomRightRadius: 20}]}
`;

const StyledButtonText = styled(Text)`
  ${[t.fontBold,t.pT2, t.text3xl, { color: '#2568EF', fontFamily: 'LuckiestGuy-Regular'}]}
`;