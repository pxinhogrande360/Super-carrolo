import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Globe, RefreshCw, Smartphone, Users, Copy, Check } from 'lucide-react';
import { BIOME_LIST, BIOME_ORDER } from '../canvas/biomeRenderer';
import { CHARACTER_LIST } from '../data/gameData';
import { getEffectiveAttributes } from '../data/saveStore';
import { ArenaBiomeId, SaveData } from '../types/game';
import { apiUrl, wsUrl } from '../utils/apiBase';
import { CharacterAvatar } from './CharacterAvatar';

interface PvpLobbyModalProps {
  save: SaveData;
  onClose: () => void;
  onStartLocalPvp: (p1CharId: string, p2CharId: string, arenaBiome: ArenaBiomeId) => void;
  onStartOnlinePvp: (
    ws: WebSocket,
    roomCode: string,
    slot: 1 | 2,
    p1CharId: string,
    p2CharId: string,
    opponentName: string,
    arenaBiome: ArenaBiomeId
  ) => void;
}

interface PublicRoomSummary {
  code: string;
  hostName: string;
  hostCharId: string;
}

export const PvpLobbyModal: React.FC<PvpLobbyModalProps> = ({
  save,
  onClose,
  onStartLocalPvp,
  onStartOnlinePvp,
}) => {
  const [tab, setTab] = useState<'LOCAL' | 'ONLINE'>('LOCAL');
  const [p1CharId, setP1CharId] = useState<string>(save.selectedCharId);
  const [p2CharId, setP2CharId] = useState<string>('nina');
  const [selectedArena, setSelectedArena] = useState<ArenaBiomeId>('docks');

  // Online LAN / WAN state
  const [playerName, setPlayerName] = useState<string>('Desafiante');
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [publicRooms, setPublicRooms] = useState<PublicRoomSummary[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const handedOffRef = useRef(false);

  const fetchRooms = async () => {
    try {
      const res = await fetch(apiUrl('/api/rooms'));
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(data.rooms || []);
      }
    } catch {
      // ignore network fetch failure
    }
  };

  useEffect(() => {
    if (tab === 'ONLINE') {
      fetchRooms();
    }
  }, [tab]);

  useEffect(() => {
    return () => {
      if (!handedOffRef.current && wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectSocket = (onOpenSend: (ws: WebSocket) => void) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    const ws = new WebSocket(wsUrl('/ws'));
    wsRef.current = ws;

    ws.onopen = () => {
      onOpenSend(ws);
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'error') {
          setStatusMsg(msg.message || 'Erro de conexão.');
          return;
        }
        if (msg.type === 'room_joined') {
          setCreatedRoomCode(msg.room.code);
          if (msg.slot === 1 && !msg.room.players[2]) {
            setStatusMsg(`Sala ${msg.room.code} criada! Aguardando Jogador 2 (LAN ou WAN)...`);
          }
        }
        if (msg.type === 'duel_start') {
          const r = msg.room;
          const mySlot: 1 | 2 = createdRoomCode && r.players[1]?.name === playerName ? 1 : r.players[2]?.name === playerName ? 2 : 1;
          // Better: determine slot from server tracking or check which player matches
          const p1 = r.players[1];
          const p2 = r.players[2];
          if (p1 && p2) {
            handedOffRef.current = true;
            const resolvedSlot: 1 | 2 = (ws as unknown as { _slot?: 1 | 2 })._slot || mySlot;
            const oppName = resolvedSlot === 1 ? p2.name : p1.name;
            const roomBiome: ArenaBiomeId = BIOME_ORDER.includes(r.biome as ArenaBiomeId)
              ? (r.biome as ArenaBiomeId)
              : 'docks';
            onStartOnlinePvp(ws, r.code, resolvedSlot, p1.charId, p2.charId, oppName, roomBiome);
          }
        }
      } catch {
        // ignore
      }
    };

    ws.onerror = () => {
      setStatusMsg('Falha ao conectar ao servidor PvP.');
    };
  };

  const handleCreateOnlineRoom = () => {
    setStatusMsg('Conectando ao servidor...');
    connectSocket((ws) => {
      (ws as unknown as { _slot?: 1 | 2 })._slot = 1;
      ws.send(
        JSON.stringify({
          type: 'create_room',
          name: playerName || 'Jogador 1',
          charId: p1CharId,
          biome: selectedArena,
          attributes: getEffectiveAttributes(save, p1CharId),
          isPublic: true,
        })
      );
    });
  };

  const handleJoinOnlineRoom = (code: string) => {
    const clean = code.toUpperCase().trim();
    if (clean.length < 4) {
      setStatusMsg('Digite um código de sala com 4 letras.');
      return;
    }
    setStatusMsg(`Entrando na sala ${clean}...`);
    connectSocket((ws) => {
      (ws as unknown as { _slot?: 1 | 2 })._slot = 2;
      ws.send(
        JSON.stringify({
          type: 'join_room',
          code: clean,
          name: playerName || 'Jogador 2',
          charId: p1CharId,
          attributes: getEffectiveAttributes(save, p1CharId),
        })
      );
    });
  };

  const handleCopyCode = () => {
    if (!createdRoomCode) return;
    navigator.clipboard?.writeText(createdRoomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="w-screen h-screen bg-[#1D1626] dark:bg-[#05070B] text-[#FFF8EB] dark:text-[#F8FAFC] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 bg-[#15101C] dark:bg-[#030509] border-b-[3px] border-[#111827] dark:border-[#94A3B8]">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="cartoon-btn px-3 py-1.5 rounded-xl bg-[#FFF8EB] dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] font-bold text-sm flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <h1 className="font-display font-extrabold text-lg sm:text-xl text-[#38BDF8]">
            Modo PvP · Duelo Entre Jogadores
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTab('LOCAL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border-2 border-[#111827] dark:border-[#94A3B8] flex items-center gap-1.5 ${
              tab === 'LOCAL'
                ? 'bg-[#38BDF8] text-[#111827]'
                : 'bg-[#2A2036] dark:bg-[#0F172A] text-[#FFF8EB] dark:text-[#F8FAFC]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Local (Mesmo Aparelho)</span>
          </button>
          <button
            onClick={() => setTab('ONLINE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border-2 border-[#111827] dark:border-[#94A3B8] flex items-center gap-1.5 ${
              tab === 'ONLINE'
                ? 'bg-[#FBBF24] dark:bg-[#FDE047] text-[#111827]'
                : 'bg-[#2A2036] dark:bg-[#0F172A] text-[#FFF8EB] dark:text-[#F8FAFC]'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>LAN / MAN / WAN</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {tab === 'LOCAL' ? (
          <div className="max-w-5xl mx-auto space-y-5">
            <div className="cartoon-outline rounded-2xl bg-[#2A2036] dark:bg-[#0B1120] p-4 sm:p-5">
              <p className="text-sm text-[#E2E8F0] dark:text-[#F8FAFC]">
                Dois jogadores no mesmo celular, tablet ou PC! Em dispositivos de toque, cada jogador controla seus botões no seu turno; no teclado, Jogador 1 usa <strong className="text-[#FBBF24] dark:text-[#FDE047]">Espaço / A / S</strong> e Jogador 2 usa <strong className="text-[#38BDF8]">Enter / K / L</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Player 1 */}
              <div className="cartoon-outline rounded-2xl bg-[#2A2036] dark:bg-[#0B1120] p-4 space-y-3">
                <h2 className="font-display font-extrabold text-base text-[#FBBF24] dark:text-[#FDE047]">
                  Jogador 1 (Esquerda)
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {CHARACTER_LIST.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setP1CharId(c.id)}
                      className={`rounded-xl p-2 border-2 border-[#111827] dark:border-[#94A3B8] flex flex-col items-center gap-1 ${
                        p1CharId === c.id
                          ? 'bg-[#FBBF24] dark:bg-[#FDE047] text-[#111827]'
                          : 'bg-[#1D1626] dark:bg-[#05070B] text-[#FFF8EB] dark:text-[#F8FAFC] hover:bg-[#352944] dark:hover:bg-[#1E293B]'
                      }`}
                    >
                      <CharacterAvatar charId={c.id} size={42} />
                      <span className="text-xs font-bold truncate w-full text-center">
                        {c.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Player 2 */}
              <div className="cartoon-outline rounded-2xl bg-[#2A2036] dark:bg-[#0B1120] p-4 space-y-3">
                <h2 className="font-display font-extrabold text-base text-[#38BDF8]">
                  Jogador 2 (Direita)
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {CHARACTER_LIST.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setP2CharId(c.id)}
                      className={`rounded-xl p-2 border-2 border-[#111827] dark:border-[#94A3B8] flex flex-col items-center gap-1 ${
                        p2CharId === c.id
                          ? 'bg-[#38BDF8] text-[#111827]'
                          : 'bg-[#1D1626] dark:bg-[#05070B] text-[#FFF8EB] dark:text-[#F8FAFC] hover:bg-[#352944] dark:hover:bg-[#1E293B]'
                      }`}
                    >
                      <CharacterAvatar charId={c.id} size={42} />
                      <span className="text-xs font-bold truncate w-full text-center">
                        {c.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Arena Selection */}
            <div className="cartoon-outline rounded-2xl bg-[#2A2036] dark:bg-[#0B1120] p-4 space-y-2.5">
              <div className="font-display font-extrabold text-sm text-[#FDE68A] dark:text-[#FDE047]">
                Arena do Duelo (Bioma)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {BIOME_LIST.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedArena(b.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border-2 border-[#111827] dark:border-[#94A3B8] truncate ${
                      selectedArena === b.id
                        ? 'bg-[#38BDF8] text-[#111827]'
                        : 'bg-[#1D1626] dark:bg-[#05070B] text-[#FFF8EB] dark:text-[#F8FAFC] hover:bg-[#352944] dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => onStartLocalPvp(p1CharId, p2CharId, selectedArena)}
                className="cartoon-btn px-8 py-3.5 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-display font-extrabold text-lg flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                <span>Começar Duelo Local 1v1</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Fighter Pick + Name */}
            <div className="lg:col-span-5 cartoon-outline rounded-2xl bg-[#2A2036] dark:bg-[#0B1120] p-4 space-y-4">
              <h2 className="font-display font-extrabold text-base text-[#FDE68A] dark:text-[#FDE047]">
                Seu Lutador Online
              </h2>
              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                  Seu Nome de Duelista
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full rounded-xl bg-[#1D1626] dark:bg-[#05070B] border-2 border-[#111827] dark:border-[#94A3B8] px-3 py-2 text-sm font-bold text-[#FFF8EB] dark:text-[#F8FAFC]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {CHARACTER_LIST.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setP1CharId(c.id)}
                    className={`rounded-xl p-2 border-2 border-[#111827] dark:border-[#94A3B8] flex flex-col items-center gap-1 ${
                      p1CharId === c.id
                        ? 'bg-[#FBBF24] dark:bg-[#FDE047] text-[#111827]'
                        : 'bg-[#1D1626] dark:bg-[#05070B] text-[#FFF8EB] dark:text-[#F8FAFC] hover:bg-[#352944] dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    <CharacterAvatar charId={c.id} size={40} />
                    <span className="text-xs font-bold truncate w-full text-center">
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>

              <div>
                <div className="text-xs font-bold text-[#CBD5E1] mb-1.5">
                  Arena da Sala (Anfitrião)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {BIOME_LIST.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedArena(b.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border-2 border-[#111827] dark:border-[#94A3B8] truncate ${
                        selectedArena === b.id
                          ? 'bg-[#38BDF8] text-[#111827]'
                          : 'bg-[#1D1626] dark:bg-[#05070B] text-[#E2E8F0] hover:bg-[#352944] dark:hover:bg-[#1E293B]'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Create or Join LAN/MAN/WAN Room */}
            <div className="lg:col-span-7 space-y-4">
              <div className="cartoon-outline rounded-2xl bg-[#2A2036] dark:bg-[#0B1120] p-4 sm:p-5 space-y-4">
                <h2 className="font-display font-extrabold text-base text-[#38BDF8]">
                  Salas em Rede (LAN / MAN / WAN)
                </h2>
                <p className="text-xs text-[#CBD5E1]">
                  Crie uma sala para gerar um código de 4 letras e compartilhe com seu amigo na mesma rede Wi-Fi (LAN) ou pela internet (WAN).
                </p>

                {createdRoomCode ? (
                  <div className="rounded-xl bg-[#1D1626] dark:bg-[#05070B] border-2 border-[#FBBF24] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-[#FBBF24] dark:text-[#FDE047]">
                        Código da Sala
                      </div>
                      <div className="font-mono-nums text-3xl font-extrabold tracking-widest text-white">
                        {createdRoomCode}
                      </div>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="cartoon-btn px-4 py-2 rounded-xl bg-[#FFF8EB] dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] font-bold text-xs flex items-center gap-1.5"
                    >
                      {copied ? <Check className="w-4 h-4 text-[#059669]" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleCreateOnlineRoom}
                      className="cartoon-btn px-5 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-display font-extrabold text-sm whitespace-nowrap"
                    >
                      Criar Nova Sala
                    </button>

                    <div className="flex flex-1 gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="CÓDIGO (ex: AB12)"
                        value={roomCodeInput}
                        onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 rounded-xl bg-[#1D1626] dark:bg-[#05070B] border-2 border-[#111827] dark:border-[#94A3B8] px-3 py-2 text-sm font-mono-nums font-bold uppercase text-[#FFF8EB] dark:text-[#F8FAFC]"
                      />
                      <button
                        onClick={() => handleJoinOnlineRoom(roomCodeInput)}
                        className="cartoon-btn px-4 py-2 rounded-xl bg-[#38BDF8] text-[#111827] font-bold text-sm whitespace-nowrap"
                      >
                        Entrar
                      </button>
                    </div>
                  </div>
                )}

                {statusMsg && (
                  <div className="text-xs font-bold text-[#FDE68A] dark:text-[#FDE047] bg-[#1D1626] dark:bg-[#05070B] rounded-lg px-3 py-2 border border-[#111827] dark:border-[#94A3B8]">
                    {statusMsg}
                  </div>
                )}
              </div>

              {/* Open Public Rooms */}
              <div className="cartoon-outline rounded-2xl bg-[#2A2036] dark:bg-[#0B1120] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-[#FFF8EB] dark:text-[#F8FAFC]">
                    Salas Abertas Agora
                  </h3>
                  <button
                    onClick={fetchRooms}
                    className="text-xs font-bold text-[#38BDF8] flex items-center gap-1 hover:underline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Atualizar</span>
                  </button>
                </div>

                {publicRooms.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] dark:text-[#CBD5E1]">
                    Nenhuma sala aberta no momento. Crie uma nova sala ao lado!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {publicRooms.map((r) => (
                      <div
                        key={r.code}
                        className="flex items-center justify-between rounded-xl bg-[#1D1626] dark:bg-[#05070B] border-2 border-[#111827] dark:border-[#94A3B8] px-3 py-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <CharacterAvatar charId={r.hostCharId} size={34} />
                          <div>
                            <div className="text-sm font-bold">{r.hostName}</div>
                            <div className="text-xs font-mono-nums text-[#FBBF24] dark:text-[#FDE047]">
                              Sala {r.code}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinOnlineRoom(r.code)}
                          className="cartoon-btn px-3 py-1.5 rounded-lg bg-[#10B981] text-white text-xs font-extrabold"
                        >
                          Desafiar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
