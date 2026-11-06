import PrototypeScreens from "./PrototypeScreens";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet,
  Text, TextInput, View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://dammpulse-api-production.up.railway.app";
const RED = "#E30613";
type Section = "Inicio" | "Equipos" | "Incidencias" | "Academia" | "Más";
const tabs: { label: Section; icon: string }[] = [
  { label: "Inicio", icon: "⌂" }, { label: "Equipos", icon: "▦" },
  { label: "Incidencias", icon: "⚑" }, { label: "Academia", icon: "▤" },
  { label: "Más", icon: "•••" },
];

function AppContent() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [section, setSection] = useState<Section>("Inicio");
  const [detail, setDetail] = useState("");

  async function signIn() {
    if (!username.trim() || !password) { setError("Introduce tu usuario y contraseña."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: username.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "No se ha podido iniciar sesión.");
      setToken(data.token || data.accessToken || "");
      setAuthenticated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión con el servidor.");
    } finally { setBusy(false); }
  }

  if (!authenticated) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.loginWrap} keyboardShouldPersistTaps="handled">
          <View style={styles.brandMark}><Text style={styles.brandStar}>✦</Text></View>
          <Text style={styles.eyebrow}>PLATAFORMA INDUSTRIAL</Text>
          <Text style={styles.logo}>DammPulse <Text style={styles.logoRed}>360</Text></Text>
          <Text style={styles.loginTitle}>Bienvenido</Text>
          <Text style={styles.muted}>Accede a tu espacio de trabajo.</Text>
          <Text style={styles.fieldLabel}>USUARIO</Text>
          <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="Tu usuario" placeholderTextColor="#9A9A9A" style={styles.input} />
          <Text style={styles.fieldLabel}>CONTRASEÑA</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Tu contraseña" placeholderTextColor="#9A9A9A" style={styles.input} onSubmitEditing={signIn} />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable onPress={signIn} disabled={busy} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, busy && styles.disabled]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Entrar  →</Text>}
          </Pressable>
          <Text style={styles.loginFoot}>DammPulse 360 · Entorno móvil</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const cards = useMemo(() => [
    { title: "Equipos y QR", subtitle: "Consulta equipos y accede a su información", icon: "▦", target: "Equipos" },
    { title: "Incidencias", subtitle: "Registra y sigue avisos de mantenimiento", icon: "⚑", target: "Incidencias" },
    { title: "Academia", subtitle: "Formación y aprendizaje", icon: "▤", target: "Academia" },
    { title: "Conocimiento experto", subtitle: "Procedimientos y documentación", icon: "✧", target: "Conocimiento experto" },
    { title: "Producto Damm", subtitle: "Información y recursos de producto", icon: "◈", target: "Producto Damm" },
    { title: "DAM Bot", subtitle: "Asistente de ayuda de la plataforma", icon: "✳", target: "DAM Bot" },
  ], []);

  function open(target: string) {
    setDetail(target);
    if (["Equipos", "Incidencias", "Academia"].includes(target)) setSection(target as Section);
    else setSection("Más");
  }

  const title = detail || section;
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View><Text style={styles.headerEyebrow}>DAMMPULSE 360</Text><Text style={styles.headerTitle}>{title}</Text></View>
        <Pressable onPress={() => { setAuthenticated(false); setPassword(""); setToken(""); setDetail(""); }} style={styles.avatar}><Text style={styles.avatarText}>{username.slice(0,1).toUpperCase() || "U"}</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {section === "Inicio" && !detail ? <>
          <View style={styles.hero}><Text style={styles.heroEyebrow}>TU ENTORNO DE TRABAJO</Text><Text style={styles.heroTitle}>Todo conectado.{"\n"}Todo bajo control.</Text><Text style={styles.heroText}>Accede rápidamente a las herramientas de tu planta.</Text><View style={styles.heroAccent} /></View>
          <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Accesos directos</Text><Text style={styles.sectionHint}>Selecciona un módulo</Text></View>
          <View style={styles.grid}>{cards.map(card => <Pressable key={card.title} onPress={() => open(card.target)} style={({pressed})=>[styles.moduleCard,pressed&&styles.pressed]}><View style={styles.moduleIcon}><Text style={styles.moduleIconText}>{card.icon}</Text></View><Text style={styles.moduleTitle}>{card.title}</Text><Text style={styles.moduleSubtitle}>{card.subtitle}</Text><Text style={styles.cardArrow}>Abrir  →</Text></Pressable>)}</View>
        </> : <>
          <Pressable onPress={() => { setDetail(""); setSection("Inicio"); }} style={styles.back}><Text style={styles.backText}>‹  Volver al inicio</Text></Pressable>
          <View style={styles.detailPanel}><View style={styles.detailIcon}><Text style={styles.moduleIconText}>{cards.find(c=>c.target===title)?.icon || "✦"}</Text></View><Text style={styles.detailTitle}>{title}</Text><Text style={styles.detailText}>Prototipo móvil en desarrollo.</Text>
          {title === "DAM Bot" && <Text style={styles.note}>El asistente se conectará a los servicios disponibles de la plataforma.</Text>}
          <Pressable onPress={() => { setDetail(""); setSection("Inicio"); }} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Volver al panel  →</Text></Pressable></View>
        </>}
        <Text style={styles.footer}>DAMMPULSE 360  ·  MOBILE</Text>
      </ScrollView>
      <View style={styles.tabBar}>{tabs.map(tab=><Pressable key={tab.label} onPress={()=>{setSection(tab.label);setDetail("");}} style={styles.tab}><Text style={[styles.tabIcon,section===tab.label&&styles.tabActive]}>{tab.icon}</Text><Text style={[styles.tabLabel,section===tab.label&&styles.tabActive]}>{tab.label}</Text></Pressable>)}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#F6F6F6"}, loginWrap:{flexGrow:1,justifyContent:"center",padding:28},
  brandMark:{width:58,height:58,borderRadius:18,backgroundColor:RED,alignItems:"center",justifyContent:"center",marginBottom:22},
  brandStar:{fontSize:32,color:"#fff"}, eyebrow:{fontSize:10,fontWeight:"800",letterSpacing:2,color:RED},
  logo:{fontSize:30,fontWeight:"900",color:"#171717",marginTop:5},logoRed:{color:RED},
  loginTitle:{fontSize:28,fontWeight:"800",color:"#171717",marginTop:48},muted:{fontSize:14,color:"#777",marginTop:7,marginBottom:30},
  fieldLabel:{fontSize:10,fontWeight:"800",letterSpacing:1.3,color:"#555",marginBottom:8,marginTop:15},
  input:{height:54,borderWidth:1,borderColor:"#E1E1E1",borderRadius:13,backgroundColor:"#fff",paddingHorizontal:16,fontSize:15,color:"#171717"},
  primaryButton:{height:54,backgroundColor:RED,borderRadius:13,alignItems:"center",justifyContent:"center",marginTop:24},
  primaryButtonText:{fontSize:15,fontWeight:"800",color:"#fff"},pressed:{opacity:0.78,transform:[{scale:0.99}]},disabled:{opacity:0.65},
  error:{color:"#B00020",fontSize:13,marginTop:12},loginFoot:{textAlign:"center",color:"#999",fontSize:11,marginTop:38},
  header:{height:74,backgroundColor:"#fff",paddingHorizontal:20,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:"#ECECEC"},
  headerEyebrow:{fontSize:9,fontWeight:"900",letterSpacing:1.8,color:RED},headerTitle:{fontSize:20,fontWeight:"900",color:"#191919",marginTop:3},
  avatar:{width:40,height:40,borderRadius:20,backgroundColor:"#191919",alignItems:"center",justifyContent:"center"},avatarText:{color:"#fff",fontWeight:"800",fontSize:16},
  content:{padding:18,paddingBottom:30},hero:{backgroundColor:"#191919",borderRadius:20,padding:22,overflow:"hidden",minHeight:190,justifyContent:"center"},
  heroEyebrow:{fontSize:9,color:"#FF777D",fontWeight:"900",letterSpacing:1.8},heroTitle:{fontSize:29,lineHeight:34,fontWeight:"900",color:"#fff",marginTop:12},
  heroText:{fontSize:12,color:"#D0D0D0",marginTop:10,maxWidth:240,lineHeight:18},heroAccent:{position:"absolute",right:-34,bottom:-54,width:160,height:160,borderRadius:80,borderWidth:22,borderColor:RED,opacity:0.9},
  sectionHeading:{marginTop:26,marginBottom:14},sectionTitle:{fontSize:18,fontWeight:"900",color:"#191919"},sectionHint:{fontSize:12,color:"#888",marginTop:4},
  grid:{flexDirection:"row",flexWrap:"wrap",gap:12},moduleCard:{width:"48%",flexGrow:1,minHeight:164,backgroundColor:"#fff",borderRadius:16,padding:15,borderWidth:1,borderColor:"#ECECEC"},
  moduleIcon:{width:38,height:38,borderRadius:12,backgroundColor:"#FFF0F1",alignItems:"center",justifyContent:"center",marginBottom:12},
  moduleIconText:{fontSize:21,color:RED,fontWeight:"800"},moduleTitle:{fontSize:14,fontWeight:"900",color:"#222"},moduleSubtitle:{fontSize:11,color:"#888",lineHeight:16,marginTop:5},
  cardArrow:{fontSize:11,fontWeight:"800",color:RED,marginTop:12},footer:{textAlign:"center",fontSize:9,fontWeight:"800",letterSpacing:1.5,color:"#AAA",marginTop:28},
  tabBar:{height:68,backgroundColor:"#fff",borderTopWidth:1,borderTopColor:"#EAEAEA",flexDirection:"row",justifyContent:"space-around",alignItems:"center",paddingBottom:5},
  tab:{flex:1,alignItems:"center",justifyContent:"center",gap:3},tabIcon:{fontSize:21,color:"#999"},tabLabel:{fontSize:9,color:"#999",fontWeight:"700"},tabActive:{color:RED},
  back:{marginBottom:16},backText:{fontSize:13,fontWeight:"800",color:RED},detailPanel:{backgroundColor:"#fff",borderRadius:18,padding:22,borderWidth:1,borderColor:"#ECECEC"},
  detailIcon:{width:52,height:52,borderRadius:15,backgroundColor:"#FFF0F1",alignItems:"center",justifyContent:"center",marginBottom:18},
  detailTitle:{fontSize:23,fontWeight:"900",color:"#191919"},detailText:{fontSize:14,lineHeight:22,color:"#777",marginTop:10},
  note:{fontSize:12,color:"#666",backgroundColor:"#F7F7F7",padding:13,borderRadius:10,marginTop:18},
});

export default function App() { return <SafeAreaProvider><AppContent /></SafeAreaProvider>; }
