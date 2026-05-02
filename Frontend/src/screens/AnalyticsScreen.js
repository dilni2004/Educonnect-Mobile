import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { getAnalytics } from '../services/analyticsService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const screenWidth = Dimensions.get('window').width;

const AnalyticsScreen = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load analytics. You might not be authorized.');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!analytics) return;

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Helvetica, sans-serif; padding: 20px; }
            h1 { color: #2C3E50; text-align: center; }
            h2 { color: #34495E; border-bottom: 2px solid #3498DB; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #BDC3C7; padding: 10px; text-align: left; }
            th { background-color: #ECF0F1; }
          </style>
        </head>
        <body>
          <h1>EduConnect Analytics Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          
          <h2>Tickets Overview</h2>
          <p><strong>Total Tickets:</strong> ${analytics.tickets.total}</p>
          <table>
            <tr><th>Status</th><th>Count</th></tr>
            <tr><td>Open</td><td>${analytics.tickets.byStatus.OPEN || 0}</td></tr>
            <tr><td>In Progress</td><td>${analytics.tickets.byStatus.IN_PROGRESS || 0}</td></tr>
            <tr><td>Escalated</td><td>${analytics.tickets.byStatus.ESCALATED || 0}</td></tr>
            <tr><td>Resolved</td><td>${analytics.tickets.byStatus.RESOLVED || 0}</td></tr>
            <tr><td>Closed</td><td>${analytics.tickets.byStatus.CLOSED || 0}</td></tr>
          </table>

          <h2>Bookings Overview</h2>
          <p><strong>Total Bookings:</strong> ${analytics.bookings.total}</p>
          <table>
            <tr><th>Status</th><th>Count</th></tr>
            <tr><td>Pending</td><td>${analytics.bookings.byStatus.PENDING || 0}</td></tr>
            <tr><td>Approved</td><td>${analytics.bookings.byStatus.APPROVED || 0}</td></tr>
            <tr><td>Rejected</td><td>${analytics.bookings.byStatus.REJECTED || 0}</td></tr>
            <tr><td>Cancelled</td><td>${analytics.bookings.byStatus.CANCELLED || 0}</td></tr>
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'Could not generate PDF');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.centered}>
        <Text>No data available or unauthorized.</Text>
      </View>
    );
  }

  const ticketData = [
    { label: 'Open', value: analytics.tickets.byStatus.OPEN || 0, color: '#3498DB' },
    { label: 'In Prog', value: analytics.tickets.byStatus.IN_PROGRESS || 0, color: '#F39C12' },
    { label: 'Resolved', value: analytics.tickets.byStatus.RESOLVED || 0, color: '#27AE60' },
    { label: 'Closed', value: analytics.tickets.byStatus.CLOSED || 0, color: '#95A5A6' },
  ];

  const bookingData = [
    { label: 'Pending', value: analytics.bookings.byStatus.PENDING || 0, color: '#F1C40F' },
    { label: 'Approved', value: analytics.bookings.byStatus.APPROVED || 0, color: '#2ECC71' },
    { label: 'Rejected', value: analytics.bookings.byStatus.REJECTED || 0, color: '#E74C3C' },
    { label: 'Cancelled', value: analytics.bookings.byStatus.CANCELLED || 0, color: '#7F8C8D' },
  ];

  const maxTicket = Math.max(...ticketData.map(d => d.value), 1);
  const maxBooking = Math.max(...bookingData.map(d => d.value), 1);

  const renderBarChart = (data, maxValue) => (
    <View style={styles.chartContainer}>
      {data.map((item, index) => {
        const heightPercent = (item.value / maxValue) * 100;
        return (
          <View key={index} style={styles.barWrapper}>
            <Text style={styles.barValue}>{item.value}</Text>
            <View style={[styles.bar, { height: `${heightPercent}%`, backgroundColor: item.color }]} />
            <Text style={styles.barLabel}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Analytics</Text>
        <TouchableOpacity style={styles.pdfButton} onPress={generatePDF}>
          <Text style={styles.pdfButtonText}>Download PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tickets Overview (Total: {analytics.tickets.total})</Text>
        {renderBarChart(ticketData, maxTicket)}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bookings Overview (Total: {analytics.bookings.total})</Text>
        {renderBarChart(bookingData, maxBooking)}
      </View>
      <View style={{height: 40}}/>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 15,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  pdfButton: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pdfButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495E',
    marginBottom: 10,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
    paddingBottom: 10,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    height: '100%',
  },
  bar: {
    width: 40,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    minHeight: 5,
  },
  barValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 10,
    color: '#7F8C8D',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default AnalyticsScreen;
