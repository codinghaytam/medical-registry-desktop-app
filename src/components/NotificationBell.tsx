import React, { useState } from 'react';
import {
    Badge,
    IconButton,
    Popover,
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Divider,
    Button
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeleteIcon from '@mui/icons-material/Delete';
import CircleIcon from '@mui/icons-material/Circle';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell: React.FC = () => {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications();

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (id: string, isRead: boolean) => {
        if (!isRead) {
            await markAsRead(id);
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteNotification(id);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'notification-popover' : undefined;

    return (
        <>
            <IconButton aria-describedby={id} color="inherit" onClick={handleClick}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: { width: 360, maxHeight: 500 }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Notifications</Typography>
                    {unreadCount > 0 && (
                        <Button size="small" onClick={() => markAllAsRead()}>
                            Mark all read
                        </Button>
                    )}
                </Box>
                <Divider />

                {notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No notifications
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ pt: 0, pb: 0 }}>
                        {notifications.map((notification) => (
                            <ListItem
                                key={notification.id}
                                disablePadding
                                secondaryAction={
                                    <IconButton edge="end" aria-label="delete" size="small" onClick={(e) => handleDelete(e, notification.id)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                }
                            >
                                <ListItemButton
                                    onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                                    sx={{
                                        bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start', mb: 0.5 }}>
                                        {!notification.isRead && (
                                            <CircleIcon color="primary" sx={{ fontSize: 10, mt: 0.8, mr: 1 }} />
                                        )}
                                        <ListItemText
                                            primary={notification.message}
                                            secondary={formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            primaryTypographyProps={{
                                                variant: 'body2',
                                                fontWeight: notification.isRead ? 'normal' : 'bold'
                                            }}
                                            secondaryTypographyProps={{
                                                variant: 'caption'
                                            }}
                                        />
                                    </Box>
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Popover>
        </>
    );
};
