import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createKBPolicy,
  deleteKBPolicy,
  getAdminKBPolicies,
  updateKBPolicy,
} from '../services/knowledgeBaseService';

const ManageKBPoliciesScreen = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', rules: '', icon: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPolicies = async () => {
    try {
      const data = await getAdminKBPolicies();
      setPolicies(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load policies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPolicies(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', rules: '', icon: '' });
    setModalVisible(true);
  };

  const openEdit = (policy) => {
    setEditing(policy);
    setForm({
      name: policy.name || '',
      description: policy.description || '',
      rules: policy.rules || '',
      icon: policy.icon || '',
    });
    setModalVisible(true);
  };

  const updateField = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  const save = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Policy name is required');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await updateKBPolicy(editing.id, form);
      } else {
        await createKBPolicy(form);
      }
      setModalVisible(false);
      fetchPolicies();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save policy');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = (policy) => {
    Alert.alert('Delete Policy', `Delete "${policy.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteKBPolicy(policy.id);
            fetchPolicies();
          } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete policy');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon ? 'lock-closed-outline' : 'shield-outline'} size={22} color="#16A085" />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name}>{item.name}</Text>
        {!!item.description && <Text style={styles.description}>{item.description}</Text>}
        {!!item.rules && <Text style={styles.rules}>Rules: {item.rules}</Text>}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
            <Ionicons name="create-outline" size={18} color="#2C3E50" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => remove(item)}>
            <Ionicons name="trash-outline" size={18} color="#E74C3C" />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#16A085" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={policies}
        keyExtractor={(item) => item.id || item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPolicies(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No policies found.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Ionicons name="add" size={24} color="#FFF" />
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <ScrollView>
              <Text style={styles.modalTitle}>{editing ? 'Edit Policy' : 'New Policy'}</Text>
              <TextInput style={styles.input} value={form.name} onChangeText={(value) => updateField('name', value)} placeholder="Policy name *" />
              <TextInput style={styles.input} value={form.icon} onChangeText={(value) => updateField('icon', value)} placeholder="Icon label, e.g. lock" />
              <TextInput style={[styles.input, styles.textArea]} value={form.description} onChangeText={(value) => updateField('description', value)} placeholder="Description" multiline textAlignVertical="top" />
              <TextInput style={[styles.input, styles.textArea]} value={form.rules} onChangeText={(value) => updateField('rules', value)} placeholder="Rules, e.g. PUBLIC" multiline textAlignVertical="top" />
              <View style={styles.modalRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 88 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  iconWrap: { backgroundColor: '#E8F8F5', borderRadius: 10, padding: 10, marginRight: 14, alignSelf: 'flex-start' },
  cardBody: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  description: { fontSize: 13, color: '#7F8C8D', marginTop: 4 },
  rules: { fontSize: 12, color: '#16A085', fontWeight: 'bold', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F5F7FA', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  actionText: { color: '#2C3E50', fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', color: '#7F8C8D', marginTop: 30 },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#16A085', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '86%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 16 },
  input: { backgroundColor: '#F5F7FA', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12, borderWidth: 1, borderColor: '#E0E6ED' },
  textArea: { minHeight: 90, paddingTop: 12 },
  modalRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#ECF0F1', borderRadius: 8, padding: 13, alignItems: 'center' },
  cancelText: { color: '#7F8C8D', fontWeight: 'bold' },
  saveBtn: { flex: 1, backgroundColor: '#16A085', borderRadius: 8, padding: 13, alignItems: 'center' },
  saveText: { color: '#FFF', fontWeight: 'bold' },
});

export default ManageKBPoliciesScreen;
