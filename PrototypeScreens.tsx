import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

const API = "https://dammpulse-api-production.up.railway.app";
type Row = { [key: string]: any };
type Props = { name: string; token?: string; demoMode?: boolean; isAdmin?: boolean; userId?: number };

async function request(token: string, path: string, method = "GET", payload?: Row) {
  const response = await fetch(API + path, {
    method,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...(payload ? { "Content-Type": "application/json" } : {}) },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  const raw = await response.text();
  let data: Row = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { /* invalid response */ }
  if (!response.ok) throw new Error(data.error || `Error del servidor (${response.status}).`);
  return data;
}

export default function PrototypeScreens({ name, token = "", demoMode = false, isAdmin = false, userId }: Props) {
  const [items,setItems]=useState<Row[]>([]);
  const [progress,setProgress]=useState<Row[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [search,setSearch]=useState("");
  const [form,setForm]=useState(false);
  const [draft,setDraft]=useState<Row>({});
  const [answer,setAnswer]=useState("");
  const [sources,setSources]=useState<Row[]>([]);
  const [asking,setAsking]=useState(false);
  const [permission,requestPermission]=useCameraPermissions();
  const [scanning,setScanning]=useState(false);

  const route = name==="Equipos"?"/api/equipment":name==="Incidencias"?"/api/incidents":
    name==="Academia"?"/api/academy/courses":name==="Conocimiento experto"?"/api/knowledge":
    name==="Producto Damm"?"/api/products":"";
  const refresh=useCallback(async()=>{
    if(!route||!token||demoMode)return;
    setBusy(true);setError("");setNotice("");
    try{
      const q=search.trim()? `?search=${encodeURIComponent(search.trim())}`:"";
      const data=await request(token,route+q);
      setItems(Array.isArray(data.items)?data.items:[]);
      setProgress(Array.isArray(data.progress)?data.progress:[]);
    }catch(e){setError(e instanceof Error?e.message:"No se han podido cargar los datos.");}
    finally{setBusy(false);}
  },[route,token,demoMode,search]);

  useEffect(()=>{setItems([]);setProgress([]);setDraft({});setSearch("");setForm(false);setAnswer("");setSources([]);setError("");setNotice("");},[name,demoMode]);
  useEffect(()=>{if(!demoMode)void refresh();},[refresh,demoMode]);

  function input(key:string,placeholder:string,multiline=false){
    return <TextInput key={key} value={String(draft[key]??"")} onChangeText={v=>setDraft(old=>({...old,[key]:v}))}
      placeholder={placeholder} placeholderTextColor="#999" multiline={multiline} style={[st.input,multiline&&st.multi]}/>;
  }
  function button(label:string,onPress:()=>void,secondary=false,disabled=false){
    return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({pressed})=>[secondary?st.secondary:st.primary,pressed&&st.pressed,disabled&&st.disabled]}>
      <Text style={secondary?st.secondaryText:st.primaryText}>{label}</Text></Pressable>;
  }
  function card(title:string,meta:string,body?:string,actions?:React.ReactNode){
    return <View key={title} style={st.card}><Text style={st.title}>{title}</Text>{!!meta&&<Text style={st.meta}>{meta}</Text>}{!!body&&<Text style={st.body}>{body}</Text>}{actions}</View>;
  }

  async function scanEquipment(){
    if(!permission?.granted){
      const result=await requestPermission();
      if(!result.granted){setError("Necesitas conceder permiso de cámara para leer el QR.");return;}
    }
    setError("");setScanning(true);
  }
  async function lookupQr(raw:string){
    setScanning(false);setError("");setNotice("");
    let code=raw.trim();
    if(code.startsWith("{")){
      try{const parsed=JSON.parse(code);code=String(parsed.code||parsed.sku||parsed.id||code);}catch{/* keep raw QR value */}
    }else if(code.indexOf("://")!==-1){
      const segments=code.split(/[?#]/)[0].split("/");
      code=decodeURIComponent(segments[segments.length-1]||code);
    }
    try{
      const data=await request(token,"/api/equipment/code/"+encodeURIComponent(code));
      setItems(data.item?[data.item]:[]);
      setSearch(code);setNotice("Equipo localizado mediante QR.");
    }catch(e){setItems([]);setError(e instanceof Error?e.message:"No se ha podido localizar el equipo.");}
  }
  async function save(){
    setError("");setNotice("");
    let path="",payload:Row={};
    if(name==="Equipos"){path="/api/equipment";payload={code:draft.code,name:draft.name,area:draft.area,description:draft.description,status:draft.status||"operativo"};}
    if(name==="Incidencias"){path="/api/incidents";payload={title:draft.title,description:draft.description,priority:draft.priority||"media"};}
    if(name==="Academia"){path="/api/academy/courses";payload={title:draft.title,description:draft.description,content:draft.content,durationMinutes:Number(draft.duration)||0,published:draft.published==="sí"};}
    if(name==="Conocimiento experto"){path="/api/knowledge";payload={title:draft.title,category:draft.category,body:draft.body,tags:draft.tags,status:draft.status||"draft"};}
    if(name==="Producto Damm"){path="/api/products";payload={sku:draft.sku,name:draft.name,category:draft.category,format:draft.format,description:draft.description};}
    try{await request(token,path,"POST",payload);setNotice("Guardado en la plataforma.");setDraft({});setForm(false);await refresh();}
    catch(e){setError(e instanceof Error?e.message:"No se ha podido guardar.");}
  }
  async function patchIncident(item:Row,status:string){
    try{await request(token,`/api/incidents/${item.id}`,"PATCH",{status});setNotice("Incidencia actualizada.");await refresh();}
    catch(e){setError(e instanceof Error?e.message:"No se ha podido actualizar.");}
  }
  async function courseProgress(courseId:number,status:string){
    try{await request(token,"/api/academy/progress","POST",{courseId,status});setNotice("Progreso de formación guardado.");await refresh();}
    catch(e){setError(e instanceof Error?e.message:"No se ha podido guardar el progreso.");}
  }
  async function ask(){
    const question=String(draft.question||"").trim();
    if(question.length<3){setError("Escribe una consulta más concreta.");return;}
    setAsking(true);setError("");setAnswer("");setSources([]);
    try{const data=await request(token,"/api/assistant/query","POST",{question});setAnswer(String(data.answer||""));setSources(Array.isArray(data.sources)?data.sources:[]);}
    catch(e){setError(e instanceof Error?e.message:"No se ha podido buscar.");}
    finally{setAsking(false);}
  }

  if(demoMode){
    const samples:Record<string,string[]>={Equipos:["Ejemplo · Llenadora 01","Ejemplo · Etiquetadora 02"],Incidencias:["Ejemplo · INC-1042","Ejemplo · INC-1041"],Academia:["Ejemplo · Seguridad en planta","Ejemplo · Buenas prácticas"],"Conocimiento experto":["Contenido demostrativo, no procedimiento oficial"],"Producto Damm":["Catálogo demostrativo"],"DAM Bot":["Asistente no conectado en modo demostración"]};
    return <View style={st.wrap}><Text style={st.warning}>MODO DEMOSTRACIÓN · DATOS FICTICIOS · NO SON REGISTROS DE PLANTA</Text>{(samples[name]||["Muestra de demostración"]).map(x=>card(x,"Ejemplo local"))}</View>;
  }

  if(name==="DAM Bot"){
    return <View style={st.wrap}>
      <Text style={st.body}>Búsqueda documental sobre artículos aprobados. No es un modelo generativo y no inventa respuestas.</Text>
      <Text style={st.warning}>Sigue siempre los procedimientos oficiales y las instrucciones de seguridad de tu planta. Si no hay documentación publicada, consulta a tu responsable.</Text>
      {input("question","¿Qué necesitas consultar?",true)}
      {button(asking?"Buscando…":"Buscar en documentación",()=>{void ask();},false,asking)}
      {asking&&<ActivityIndicator color="#E30613"/>}
      {!!answer&&card("Resultado","Búsqueda documental",answer)}
      {sources.map(x=>card(String(x.title),String(x.category||"Documento"),String(x.excerpt||"")))}
      {!!error&&<Text accessibilityRole="alert" style={st.error}>{error}</Text>}
    </View>;
  }

  const canCreate=isAdmin||name==="Incidencias";
  const fields=name==="Equipos"?<>{input("code","Código de equipo")}{input("name","Nombre")}{input("area","Área / línea")}{input("status","operativo / mantenimiento / fuera_de_servicio")}{input("description","Descripción",true)}</>:
    name==="Incidencias"?<>{input("title","Título")}{input("description","Descripción del problema",true)}{input("priority","baja / media / alta / critica")}</>:
    name==="Academia"?<>{input("title","Título del curso")}{input("description","Descripción")}{input("duration","Duración en minutos")}{input("content","Contenido formativo",true)}{input("published","Escribe sí para publicar; otro valor = borrador")}</>:
    name==="Conocimiento experto"?<>{input("title","Título")}{input("category","Categoría")}{input("tags","Etiquetas")}{input("body","Texto del procedimiento aprobado",true)}{input("status","draft / published (por defecto borrador)")}</>:
    <>{input("sku","Código SKU")}{input("name","Nombre del producto")}{input("category","Categoría")}{input("format","Formato")}{input("description","Descripción",true)}</>;

  return <View style={st.wrap}>
    <Text style={st.body}>{name==="Equipos"?"Inventario compartido de equipos.":name==="Incidencias"?"Registro y seguimiento compartido de incidencias.":name==="Academia"?"Cursos publicados y progreso individual.":name==="Conocimiento experto"?"Procedimientos y artículos aprobados.":"Catálogo de producto compartido."}</Text>
    {(name==="Equipos"||name==="Conocimiento experto"||name==="Producto Damm")&&<View style={st.row}><View style={st.grow}>{input("search","Buscar…")}</View>{button("Buscar",()=>{void refresh();},true)}</View>}
    <View style={st.row}>{button(busy?"Cargando…":"Actualizar",()=>{void refresh();},true,busy)}{name==="Equipos"&&button(scanning?"Cerrar lector QR":"Leer QR",()=>{if(scanning)setScanning(false);else void scanEquipment();},true)}{canCreate&&button(form?"Cerrar":"Añadir",()=>setForm(v=>!v),true)}</View>
    {scanning&&<View style={st.cameraWrap}><CameraView style={st.camera} facing="back" barcodeScannerSettings={{barcodeTypes:["qr"]}} onBarcodeScanned={({data})=>{void lookupQr(data);}}/><Text style={st.meta}>Enfoca el código QR del equipo dentro del marco de cámara.</Text>{button("Cancelar lectura",()=>setScanning(false),true)}</View>}
    {form&&<View style={st.form}><Text style={st.title}>{name==="Incidencias"?"Nueva incidencia":"Nuevo registro"}</Text>{fields}{button("Guardar",()=>{void save();})}</View>}
    {!!notice&&<Text style={st.success}>{notice}</Text>}
    {!!error&&<Text accessibilityRole="alert" style={st.error}>{error}</Text>}
    {busy&&items.length===0&&<ActivityIndicator color="#E30613"/>}
    {!busy&&items.length===0&&<View style={st.card}><Text style={st.title}>Sin registros todavía</Text><Text style={st.meta}>No se muestran datos ficticios. El administrador debe cargar información real o publicar el contenido.</Text></View>}
    {name==="Equipos"&&items.map(x=>card(`${x.name} · ${x.code}`,[x.area,x.status].filter(Boolean).join(" · "),x.description))}
    {name==="Incidencias"&&items.map(x=>{const editable=isAdmin||Number(x.createdBy)===Number(userId);return card(`#${x.id} · ${x.title}`,[x.priority,x.status,x.equipmentCode].filter(Boolean).join(" · "),x.description,editable&&x.status!=="resuelta"?<View style={st.row}>{x.status==="abierta"&&button("En curso",()=>{void patchIncident(x,"en_curso");},true)}{button("Resolver",()=>{void patchIncident(x,"resuelta");},true)}</View>:null);})}
    {name==="Academia"&&items.map(x=>{const p=progress.find(y=>Number(y.courseId)===Number(x.id));return card(String(x.title),[`${x.durationMinutes||0} min`,p?.status==="completed"?"Completado":p?.status==="in_progress"?"En curso":"Sin empezar"].join(" · "),[x.description,x.content].filter(Boolean).join("\n\n"),p?.status==="completed"?<Text style={st.success}>Completado</Text>:button(p?.status==="in_progress"?"Marcar completado":"Empezar",()=>{void courseProgress(Number(x.id),p?.status==="in_progress"?"completed":"in_progress");},true));})}
    {name==="Conocimiento experto"&&items.map(x=>card(String(x.title),String(x.category||"General"),String(x.body||"")))}
    {name==="Producto Damm"&&items.map(x=>card(`${x.name} · ${x.sku}`,[x.category,x.format].filter(Boolean).join(" · "),x.description))}
  </View>;
}

const st=StyleSheet.create({
  wrap:{gap:11,marginTop:16},cameraWrap:{backgroundColor:"#fff",padding:10,borderRadius:12,gap:8,borderWidth:1,borderColor:"#eee"},camera:{height:250,width:"100%",borderRadius:10,overflow:"hidden"},row:{flexDirection:"row",gap:8,alignItems:"center",flexWrap:"wrap"},grow:{flex:1},
  input:{minHeight:44,borderWidth:1,borderColor:"#E2E2E2",borderRadius:10,backgroundColor:"#fff",paddingHorizontal:12,paddingVertical:10,fontSize:13,color:"#222",marginBottom:7},
  multi:{minHeight:86,textAlignVertical:"top"},primary:{backgroundColor:"#E30613",padding:13,borderRadius:10,alignItems:"center"},primaryText:{color:"#fff",fontWeight:"800",fontSize:12},
  secondary:{backgroundColor:"#fff",padding:12,borderRadius:10,borderWidth:1,borderColor:"#ddd",alignItems:"center"},secondaryText:{color:"#333",fontWeight:"800",fontSize:12},
  pressed:{opacity:.75},disabled:{opacity:.5},form:{backgroundColor:"#F8F8F8",padding:13,borderRadius:12,borderWidth:1,borderColor:"#eee"},
  card:{backgroundColor:"#fff",padding:14,borderRadius:12,borderWidth:1,borderColor:"#eee",gap:5},title:{fontSize:14,fontWeight:"900",color:"#222"},
  meta:{fontSize:11,color:"#888",lineHeight:17},body:{fontSize:12,color:"#555",lineHeight:19},warning:{fontSize:12,color:"#765B16",backgroundColor:"#FFF4D4",padding:11,borderRadius:10,lineHeight:18},
  error:{fontSize:12,color:"#B00020",backgroundColor:"#FCECEF",padding:10,borderRadius:9},success:{fontSize:12,color:"#267343",fontWeight:"800"},
});
