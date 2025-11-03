import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query } from '../utils/firebase';

// =====================================================
// HOOK: useAdminData (Tải dữ liệu cho Admin)
// =====================================================
const useAdminData = (role) => {
  const [adminData, setAdminData] = useState({
    users: [],
    transactions: [],
    orders: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (role !== 'admin') {
      setAdminData(prev => ({ ...prev, loading: false }));
      return; // Không phải admin, không tải
    }

    let usersLoaded = false;
    let transactionsLoaded = false;
    let ordersLoaded = false;
    const errors = [];

    const checkLoadingDone = () => {
      if (usersLoaded && transactionsLoaded && ordersLoaded) {
        setAdminData(prev => ({
          ...prev,
          loading: false,
          error: errors.length > 0 ? errors.join(', ') : null,
        }));
      }
    };

    // Tải Users
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setAdminData(prev => ({ ...prev, users: userList }));
      usersLoaded = true;
      checkLoadingDone();
    }, (err) => {
      console.error("Lỗi tải danh sách người dùng:", err);
      errors.push("Lỗi tải người dùng");
      usersLoaded = true;
      checkLoadingDone();
    });

    // Tải Transactions
    const qTrans = query(collection(db, 'transactions'));
    const unsubTrans = onSnapshot(qTrans, (snapshot) => {
      const transList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdminData(prev => ({ ...prev, transactions: transList }));
      transactionsLoaded = true;
      checkLoadingDone();
    }, (err) => {
      console.error("Lỗi tải giao dịch:", err);
      errors.push("Lỗi tải giao dịch");
      transactionsLoaded = true;
      checkLoadingDone();
    });

    // Tải Orders
    const qOrders = query(collection(db, 'orders'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdminData(prev => ({ ...prev, orders: orderList }));
      ordersLoaded = true;
      checkLoadingDone();
    }, (err) => {
      console.error("Lỗi tải đơn hàng:", err);
      errors.push("Lỗi tải đơn hàng");
      ordersLoaded = true;
      checkLoadingDone();
    });

    return () => {
      unsubUsers();
      unsubTrans();
      unsubOrders();
    };
  }, [role]);

  return adminData;
};

export { useAdminData };