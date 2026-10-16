import re,sys
s=open(sys.argv[1]).read()
for pat in [r'<!doctype html>\s*',r'<html[^>]*>\s*',r'</html>\s*',r'<head>\s*',r'</head>\s*',r'<body[^>]*>\s*',r'</body>\s*',r'<meta charset="utf-8">\s*',r'<meta name="viewport"[^>]*>\s*']:
  s=re.sub(pat,'',s,count=1,flags=re.I)
a="ROOM=typeof WebSocket!=='undefined';";assert a in s;s=s.replace(a,"ROOM=false;")
a="Este navegador não consegue abrir salas online. Tente pelo Chrome ou Safari atualizados.";assert a in s
s=s.replace(a,"Esta é a prévia dentro do Claude, onde o multiplayer não consegue se conectar. Para jogar com os amigos, use o site: mayconsilvaseguranca-eng.github.io/coringa21")
s=s.replace("<title>Família 21</title>\n","<title>Família 21</title>\n<meta name=\"claude:viewport-fit-sides\" content=\"cover\">\n",1)
open(sys.argv[2],'w').write(s)
