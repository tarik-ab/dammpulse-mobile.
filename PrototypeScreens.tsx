import React from "react";
import {Text,View,StyleSheet} from "react-native";
export default function PrototypeScreens({name}:{name:string}){
const data:Record<string,string[]>={Equipos:["Llenadora 01 · EQ-001 · Operativo","Etiquetadora 02 · EQ-002 · Revisión","Cinta transportadora · EQ-003"],Incidencias:["INC-1042 · Vibración anómala · Alta","INC-1041 · Revisión de sensor · Media"],Academia:["Seguridad en planta · 12 min","Buenas prácticas de mantenimiento · 18 min","Calidad en envasado · 15 min"],"Conocimiento experto":["Procedimientos operativos","Guías de resolución","Buenas prácticas"],"Producto Damm":["Catálogo y formatos","Características de producto","Recursos de calidad"],"DAM Bot":["Asistente de ayuda","Consultas sobre equipos","Orientación sobre incidencias"]};
return <View style={s.wrap}>{(data[name]||["Contenido de demostración"]).map(x=><View key={x} style={s.card}><Text style={s.text}>{x}</Text></View>)}</View>}
const s=StyleSheet.create({wrap:{gap:10},card:{backgroundColor:"#fff",padding:16,borderRadius:12,borderWidth:1,borderColor:"#eee"},text:{fontSize:13,fontWeight:"700",color:"#222"}});
