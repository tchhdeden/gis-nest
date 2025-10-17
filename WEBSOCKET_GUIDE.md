# Hướng Dẫn Sử Dụng WebSocket Maps

## 📌 Tổng Quan

Dự án này sử dụng **WebSocket Gateway** của NestJS để tạo real-time communication cho Maps resource.

## 🚀 Cách Sử Dụng

### 1. **Khởi Chạy Server**

```bash
npm run start:dev
```

Server sẽ chạy tại: `http://localhost:3000`

### 2. **Test WebSocket bằng HTML Client**

Mở trình duyệt và truy cập: `http://localhost:3000/index.html`

### 3. **Các Events WebSocket Có Sẵn**

#### 📤 **Events từ Client → Server:**

| Event | Payload | Mô tả |
|-------|---------|-------|
| `createMap` | `{ name: string, description: string }` | Tạo map mới |
| `findAllMaps` | `{}` | Lấy tất cả maps |
| `findOneMap` | `number` (id) | Lấy một map theo ID |
| `updateMap` | `{ id: number, name: string, description: string }` | Cập nhật map |
| `removeMap` | `number` (id) | Xóa map theo ID |

## 💻 Code Ví Dụ

### **Sử dụng Socket.IO Client (JavaScript)**

```javascript
// Kết nối đến server
const socket = io('http://localhost:3000');

// Lắng nghe khi kết nối thành công
socket.on('connect', () => {
    console.log('Connected to server');
});

// Tạo map mới
socket.emit('createMap', 
    { name: 'My Map', description: 'This is my map' }, 
    (response) => {
        console.log(response);
    }
);

// Lấy tất cả maps
socket.emit('findAllMaps', {}, (response) => {
    console.log(response);
});

// Lấy một map
socket.emit('findOneMap', 1, (response) => {
    console.log(response);
});

// Cập nhật map
socket.emit('updateMap', 
    { id: 1, name: 'Updated Map', description: 'Updated' },
    (response) => {
        console.log(response);
    }
);

// Xóa map
socket.emit('removeMap', 1, (response) => {
    console.log(response);
});
```

### **Sử dụng Socket.IO Client (Node.js)**

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('Connected!');
    
    // Tạo map
    socket.emit('createMap', 
        { name: 'Test Map', description: 'From Node.js' },
        (response) => {
            console.log('Create response:', response);
        }
    );
});

socket.on('disconnect', () => {
    console.log('Disconnected');
});
```

### **Sử dụng với React**

```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function MapsComponent() {
    const [socket, setSocket] = useState(null);
    const [maps, setMaps] = useState([]);

    useEffect(() => {
        const newSocket = io('http://localhost:3000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket');
        });

        return () => newSocket.close();
    }, []);

    const createMap = () => {
        socket?.emit('createMap', 
            { name: 'New Map', description: 'React Map' },
            (response) => {
                console.log(response);
            }
        );
    };

    const getAllMaps = () => {
        socket?.emit('findAllMaps', {}, (response) => {
            console.log(response);
            setMaps(response);
        });
    };

    return (
        <div>
            <button onClick={createMap}>Create Map</button>
            <button onClick={getAllMaps}>Get All Maps</button>
            <div>{JSON.stringify(maps)}</div>
        </div>
    );
}
```

## 🔧 Cấu Trúc Code

### **Gateway** (`maps.gateway.ts`)
- Xử lý các WebSocket events
- Sử dụng decorator `@SubscribeMessage()` để lắng nghe events
- Kết nối với MapsService để xử lý business logic

### **Service** (`maps.service.ts`)
- Chứa business logic
- CRUD operations cho Maps
- Có thể kết nối với database (hiện tại đang return mock data)

### **Module** (`maps.module.ts`)
- Đăng ký Gateway và Service
- Quản lý dependencies

## 🎯 Tính Năng Có Thể Mở Rộng

1. **Broadcasting**: Gửi thông báo đến tất cả clients
2. **Rooms**: Chia clients vào các rooms khác nhau
3. **Authentication**: Xác thực người dùng qua WebSocket
4. **Database Integration**: Kết nối với database thực (PostgreSQL, MongoDB, etc.)

### Ví Dụ Broadcasting:

```typescript
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class MapsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('createMap')
  create(@MessageBody() createMapDto: CreateMapDto) {
    const result = this.mapsService.create(createMapDto);
    
    // Broadcast đến tất cả clients
    this.server.emit('mapCreated', result);
    
    return result;
  }
}
```

## 📚 Tài Liệu Tham Khảo

- [NestJS WebSocket Documentation](https://docs.nestjs.com/websockets/gateways)
- [Socket.IO Documentation](https://socket.io/docs/v4/)

## ⚠️ Lưu Ý

- WebSocket chạy trên cùng port với HTTP server (port 3000)
- CORS đã được enable trong `main.ts`
- Cần cài đặt `@nestjs/websockets`, `@nestjs/platform-socket.io`, và `socket.io`
